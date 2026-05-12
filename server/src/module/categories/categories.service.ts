import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { Category } from "./schemas/category.schema";

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? new Date().toISOString()
      : value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async getAll(query: Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const limit = Math.max(1, Number(query.limit ?? "12") || 12);
    const search = (query.search ?? "").trim();
    const isActive = query.isActive;

    const filter: Record<string, unknown> = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { slug: { $regex: escaped, $options: "i" } },
      ];
    }

    if (isActive === "true" || isActive === "false") {
      filter.isActive = isActive === "true";
    }

    const totalResults = await this.categoryModel.countDocuments(filter);
    const categories = await this.categoryModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      results: categories.length,
      totalResults,
      page,
      totalPages: Math.max(1, Math.ceil(totalResults / limit)),
      data: {
        categories: categories.map((category) =>
          this.toCategoryResponse(category),
        ),
      },
    };
  }

  async getById(id: string) {
    const category = await this.categoryModel.findById(id).lean();
    return category
      ? { data: { category: this.toCategoryResponse(category) } }
      : null;
  }

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name);
    const created = await this.categoryModel.create({
      name: dto.name,
      slug,
      description: dto.description ?? "",
      isActive: dto.isActive ?? true,
    });

    return {
      message: "Category created",
      data: { category: this.toCategoryResponse(created.toObject()) },
    };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const payload: Record<string, unknown> = {};

    if (dto.name) {
      payload.name = dto.name;
      payload.slug = slugify(dto.name);
    }
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;

    const updated = await this.categoryModel
      .findByIdAndUpdate(id, payload, { new: true })
      .lean();

    return updated
      ? {
          message: "Category updated",
          data: { category: this.toCategoryResponse(updated) },
        }
      : null;
  }

  async remove(id: string) {
    const deleted = await this.categoryModel.findByIdAndDelete(id);
    return Boolean(deleted);
  }

  private toCategoryResponse(category: {
    _id: unknown;
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
  }) {
    return {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      isActive: Boolean(category.isActive),
      createdAt: toIsoString(category.createdAt),
      updatedAt: toIsoString(category.updatedAt),
    };
  }
}
