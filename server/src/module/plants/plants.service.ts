import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UpsertPlantDto } from "./dto/upsert-plant.dto";
import { Plant } from "./schemas/plant.schema";
import { generateSlug, ensureUniqueSlug } from "../../helpers/slug.utils";

type PlantResponseInput = {
  _id: unknown;
  name: string;
  slug: string;
  price: number;
  costPrice?: number;
  discountPercentage?: number;
  imageCover: string;
  category: string;
  tags?: string[];
  availability: "In Stock" | "Out Of Stock" | "Up Coming";
  stock?: number;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  description?: string;
  rating?: number;
};

@Injectable()
export class PlantsService {
  constructor(
    @InjectModel(Plant.name) private readonly plantModel: Model<Plant>,
  ) {}

  async onModuleInit() {
    await this.seedPlantsIfEmpty();
  }

  async getTotalPlants(): Promise<number> {
    return this.plantModel.countDocuments();
  }

  async getAll(query: Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const limit = Math.max(1, Number(query.limit ?? "12") || 12);
    const minPrice = Number(query["price[gte]"] ?? "0") || 0;
    const maxPrice =
      Number(query["price[lte]"] ?? `${Number.MAX_SAFE_INTEGER}`) ||
      Number.MAX_SAFE_INTEGER;
    const search = (query.search ?? "").toLowerCase().trim();
    const queryTags = this.splitCsv(query.tag);
    const categories = this.splitCsv(query.category);
    const availabilities = this.splitCsv(query.availability);

    const filter: Record<string, unknown> = {
      price: { $gte: minPrice, $lte: maxPrice },
    };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (queryTags.length > 0) {
      filter.tags = { $in: queryTags };
    }
    if (categories.length > 0) {
      filter.category = { $in: categories };
    }
    if (availabilities.length > 0) {
      filter.availability = { $in: availabilities };
    }
    // Filter for deals: products with active discounts
    if (query.deal === "true") {
      filter.discountPercentage = { $gt: 0 };
    }

    const totalResults = await this.plantModel.countDocuments(filter);
    const items = await this.plantModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return {
      results: items.length,
      totalResults,
      page,
      totalPages: Math.max(1, Math.ceil(totalResults / limit)),
      data: {
        plants: items.map((item) => this.toPlantResponse(item)),
      },
    };
  }

  async getFeatured() {
    const plants = await this.plantModel
      .find({ isFeatured: true })
      .limit(8)
      .sort({ createdAt: -1 })
      .lean();

    return {
      data: {
        plants: plants.map((item) => this.toPlantResponse(item)),
      },
    };
  }

  async getFlashSale() {
    const plants = await this.plantModel.find({ isFlashSale: true }).lean();
    return {
      data: {
        plants: plants.map((item) => this.toPlantResponse(item)),
      },
    };
  }

  async getStats() {
    const plants = await this.plantModel.find().lean();
    const total = plants.length;
    const inStock = plants.filter(
      (item) => item.availability === "In Stock",
    ).length;
    const avgPrice =
      total === 0
        ? 0
        : Math.round(plants.reduce((sum, item) => sum + item.price, 0) / total);

    return {
      data: {
        totalPlants: total,
        inStock,
        averagePrice: avgPrice,
      },
    };
  }

  async getByAvailability(availability: string) {
    const plants = await this.plantModel
      .find({ availability: { $regex: `^${availability}$`, $options: "i" } })
      .lean();

    return {
      data: {
        plants: plants.map((item) => this.toPlantResponse(item)),
      },
    };
  }

  async getById(id: string) {
    const plant = await this.plantModel.findById(id).lean();
    return plant
      ? {
          data: {
            plant: this.toPlantResponse(plant),
          },
        }
      : null;
  }

  async create(dto: UpsertPlantDto) {
    // Generate unique slug from product name
    const baseSlug = generateSlug(dto.name);
    const existingSlugs = await this.plantModel
      .find({ slug: { $regex: `^${baseSlug}(-[0-9]+)?$` } })
      .select("slug")
      .lean();
    const existingSlugsArray = existingSlugs.map((p) => p.slug);
    const uniqueSlug = await ensureUniqueSlug(baseSlug, existingSlugsArray);

    const newPlant = await this.plantModel.create({
      name: dto.name,
      slug: uniqueSlug,
      price: dto.price,
      costPrice: dto.costPrice ?? 0,
      imageCover: dto.imageCover,
      category: dto.category,
      tags: dto.tags ?? [],
      availability: dto.availability,
      stock: dto.stock ?? 0,
      discountPercentage: dto.discountPercentage ?? 0,
      isFeatured: dto.isFeatured ?? false,
      isFlashSale: dto.isFlashSale ?? false,
      description: dto.description ?? "",
    });

    return {
      message: "Plant created",
      data: {
        plant: this.toPlantResponse(newPlant.toObject()),
      },
    };
  }

  async update(id: string, dto: UpsertPlantDto) {
    const target = await this.plantModel
      .findByIdAndUpdate(
        id,
        {
          name: dto.name,
          price: dto.price,
          costPrice: dto.costPrice ?? 0,
          imageCover: dto.imageCover,
          category: dto.category,
          tags: dto.tags ?? [],
          availability: dto.availability,
          stock: dto.stock ?? 0,
          discountPercentage: dto.discountPercentage ?? 0,
          isFeatured: dto.isFeatured ?? false,
          isFlashSale: dto.isFlashSale ?? false,
          description: dto.description ?? "",
        },
        { new: true },
      )
      .lean();

    if (!target) {
      return null;
    }

    return {
      message: "Plant updated",
      data: {
        plant: this.toPlantResponse(target),
      },
    };
  }

  async remove(id: string) {
    const result = await this.plantModel.findByIdAndDelete(id);
    return Boolean(result);
  }

  /**
   * Decrement stock for a plant by a given quantity.
   * Automatically sets availability to "Out Of Stock" when stock reaches 0.
   */
  async decrementStock(
    plantId: string,
    quantity: number,
  ): Promise<void> {
    const plant = await this.plantModel.findById(plantId);
    if (!plant) return;

    const newStock = Math.max(0, plant.stock - quantity);
    const update: Record<string, unknown> = { stock: newStock };
    if (newStock === 0) {
      update.availability = "Out Of Stock";
    }

    await this.plantModel.findByIdAndUpdate(plantId, { $set: update });
  }

  private splitCsv(value?: string): string[] {
    if (!value) return [];
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private toPlantResponse(plant: PlantResponseInput) {
    const discountPct = plant.discountPercentage ?? 0;
    const salePrice =
      discountPct > 0
        ? Math.round(plant.price * (1 - discountPct / 100))
        : plant.price;

    return {
      _id: String(plant._id),
      slug: plant.slug,
      name: plant.name,
      price: plant.price,
      costPrice: plant.costPrice ?? 0,
      salePrice,
      discountPercentage: discountPct,
      imageCover: plant.imageCover,
      category: plant.category,
      tags: plant.tags ?? [],
      availability: plant.availability,
      stock: plant.stock ?? 0,
      isFeatured: plant.isFeatured ?? false,
      isFlashSale: plant.isFlashSale ?? false,
      description: plant.description ?? "",
      rating: plant.rating ?? 0,
    };
  }

  private async seedPlantsIfEmpty(): Promise<void> {
    const total = await this.plantModel.countDocuments();
    if (total > 0) {
      return;
    }

    await this.plantModel.insertMany([
      {
        name: "Aloe Vera",
        slug: "aloe-vera",
        price: 200,
        imageCover: "/frontend/Featured Products/image1.jpg",
        category: "Succulent Plants",
        tags: ["indoor", "easy-care", "desktop"],
        availability: "In Stock",
        stock: 30,
        discountPercentage: 0,
        isFeatured: true,
        isFlashSale: false,
        description: "Low-maintenance plant known for medicinal value.",
      },
      {
        name: "Snake Plant",
        slug: "snake-plant",
        price: 250,
        imageCover: "/frontend/Featured Products/image4.jpg",
        category: "Foliage Plants",
        tags: ["indoor", "easy-care", "office"],
        availability: "In Stock",
        stock: 24,
        discountPercentage: 10,
        isFeatured: false,
        isFlashSale: true,
        description: "Air-purifying and very beginner-friendly plant.",
      },
      {
        name: "Money Plant",
        slug: "money-plant",
        price: 400,
        imageCover: "/frontend/Featured Products/image7.jpg",
        category: "Climbing Plants",
        tags: ["indoor", "living-room", "balcony"],
        availability: "In Stock",
        stock: 18,
        discountPercentage: 5,
        isFeatured: true,
        isFlashSale: false,
        description: "Popular decorative vine for homes and balconies.",
      },
      {
        name: "Peace Lily",
        slug: "peace-lily",
        price: 600,
        imageCover: "/frontend/Featured Products/image8.jpg",
        category: "Flowering Plants",
        tags: ["indoor", "shade-loving", "bedroom"],
        availability: "Up Coming",
        stock: 0,
        discountPercentage: 0,
        isFeatured: false,
        isFlashSale: false,
        description: "Elegant flowering indoor plant with glossy leaves.",
      },
    ]);
  }
}
