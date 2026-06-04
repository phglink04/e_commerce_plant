import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UpsertPlantDto } from "./dto/upsert-plant.dto";
import { Plant } from "./schemas/plant.schema";
import { Order } from "../orders/schemas/order.schema";
import { generateSlug, ensureUniqueSlug, removeVietnameseTones } from "../../helpers/slug.utils";

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
  availability: "In Stock" | "Out Of Stock" | "Up Coming" | "Discontinued";
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
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @Inject(forwardRef(() => 'CHATBOT_EMBEDDING'))
    private readonly embeddingFn: ((text: string) => Promise<number[]>) | null,
  ) {}

  async onModuleInit() {
    await this.seedPlantsIfEmpty();
    await this.migrateNormalizedNames();
  }

  private async migrateNormalizedNames(): Promise<void> {
    try {
      const unmigrated = await this.plantModel.find({
        $or: [{ normalizedName: { $exists: false } }, { normalizedName: "" }],
      });
      if (unmigrated.length > 0) {
        console.log(`[Migration] Migrating ${unmigrated.length} plants for normalizedName...`);
        for (const plant of unmigrated) {
          const norm = removeVietnameseTones(plant.name).toLowerCase().trim();
          await this.plantModel.findByIdAndUpdate(plant._id, {
            $set: { normalizedName: norm },
          });
        }
        console.log(`[Migration] Successfully migrated all plants.`);
      }
    } catch (err) {
      console.error("[Migration] Error migrating plant normalizedName:", err);
    }
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
      const searchNormalized = removeVietnameseTones(search).toLowerCase().trim();
      filter.normalizedName = { $regex: searchNormalized, $options: "i" };
    }
    if (queryTags.length > 0) {
      filter.tags = { $in: queryTags };
    }
    if (categories.length > 0) {
      filter.category = { $in: categories };
    }
    if (query.admin !== "true" && query.includeDiscontinued !== "true") {
      if (availabilities.length > 0) {
        const filteredAvailabilities = availabilities.filter((a) => a !== "Discontinued");
        filter.availability = { $in: filteredAvailabilities };
      } else {
        filter.availability = { $ne: "Discontinued" };
      }
    } else {
      if (availabilities.length > 0) {
        filter.availability = { $in: availabilities };
      }
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
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    const plantIds = items.map((item) => String(item._id));
    const soldCounts = await this.orderModel.aggregate([
      {
        $match: {
          orderStatus: "delivered",
          paymentStatus: "paid",
          "items.plantId": { $in: plantIds },
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.plantId": { $in: plantIds },
        },
      },
      {
        $group: {
          _id: "$items.plantId",
          totalSold: { $sum: "$items.quantity" },
        },
      },
    ]);

    const soldMap = new Map<string, number>();
    soldCounts.forEach((s) => {
      soldMap.set(String(s._id), s.totalSold);
    });

    return {
      results: items.length,
      totalResults,
      page,
      totalPages: Math.max(1, Math.ceil(totalResults / limit)),
      data: {
        plants: items.map((item) => ({
          ...this.toPlantResponse(item),
          sold: soldMap.get(String(item._id)) || 0,
        })),
      },
    };
  }

  async getFeatured() {
    const plants = await this.plantModel
      .find({ isFeatured: true, availability: { $ne: "Discontinued" } })
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
    const plants = await this.plantModel.find({ isFlashSale: true, availability: { $ne: "Discontinued" } }).lean();
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

    // Auto-sync availability với stock
    let stock = dto.stock ?? 0;
    let availability = dto.availability;
    if (availability === 'Discontinued') {
      stock = 0;
    } else {
      if (stock === 0 && availability !== 'Up Coming') {
        availability = 'Out Of Stock';
      } else if (stock > 0 && availability === 'Out Of Stock') {
        availability = 'In Stock';
      }
    }

    const newPlant = await this.plantModel.create({
      name: dto.name,
      normalizedName: removeVietnameseTones(dto.name).toLowerCase().trim(),
      slug: uniqueSlug,
      price: dto.price,
      costPrice: dto.costPrice ?? 0,
      imageCover: dto.imageCover,
      category: dto.category,
      tags: dto.tags ?? [],
      availability,
      stock,
      discountPercentage: dto.discountPercentage ?? 0,
      isFeatured: dto.isFeatured ?? false,
      isFlashSale: dto.isFlashSale ?? false,
      description: dto.description ?? "",
    });

    // Auto-generate embedding cho sản phẩm mới (non-blocking)
    this.generateAndSaveEmbedding(newPlant._id.toString(), dto);

    return {
      message: "Plant created",
      data: {
        plant: this.toPlantResponse(newPlant.toObject()),
      },
    };
  }

  async update(id: string, dto: UpsertPlantDto) {
    // Auto-sync availability với stock
    let stock = dto.stock ?? 0;
    let availability = dto.availability;
    if (availability === 'Discontinued') {
      stock = 0;
    } else {
      if (stock === 0 && availability !== 'Up Coming') {
        availability = 'Out Of Stock';
      } else if (stock > 0 && availability === 'Out Of Stock') {
        availability = 'In Stock';
      }
    }

    const target = await this.plantModel
      .findByIdAndUpdate(
        id,
        {
          name: dto.name,
          normalizedName: removeVietnameseTones(dto.name).toLowerCase().trim(),
          price: dto.price,
          costPrice: dto.costPrice ?? 0,
          imageCover: dto.imageCover,
          category: dto.category,
          tags: dto.tags ?? [],
          availability,
          stock,
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

    // Auto-generate embedding khi cập nhật sản phẩm (non-blocking)
    this.generateAndSaveEmbedding(id, dto);

    return {
      message: "Plant updated",
      data: {
        plant: this.toPlantResponse(target),
      },
    };
  }

  async remove(id: string) {
    const result = await this.plantModel.findByIdAndUpdate(
      id,
      { availability: "Discontinued", stock: 0 },
      { new: true }
    );
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

  private async generateAndSaveEmbedding(plantId: string, dto: UpsertPlantDto): Promise<void> {
    try {
      if (!this.embeddingFn) return;

      // Kiểm tra biến môi trường để tắt sinh Embedding chạy ngầm khi code
      if (process.env.GEMINI_BYPASS_EMBEDDING === 'true') {
        console.log(`[Gemini Optimization] Bypassed background embedding generation for: ${dto.name}`);
        return;
      }

      const searchText = [
        dto.name,
        dto.category,
        dto.description || '',
        ...(dto.tags || []),
      ].filter(Boolean).join(' ');

      const embedding = await this.embeddingFn(searchText);
      if (embedding && embedding.length > 0) {
        await this.plantModel.findByIdAndUpdate(plantId, { $set: { embedding } });
      }
    } catch (error) {
      // Non-blocking — log lỗi nhưng không ảnh hưởng CRUD
      console.error(`Failed to generate embedding for plant ${plantId}:`, error);
    }
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
