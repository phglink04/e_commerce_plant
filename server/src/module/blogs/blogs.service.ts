import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UpsertBlogDto } from "./dto/upsert-blog.dto";
import { Blog } from "./schemas/blog.schema";
import { generateSlug, ensureUniqueSlug } from "../../helpers/slug.utils";

type BlogResponseInput = {
  _id: unknown;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage: string;
  category: string;
  tags?: string[];
  status: "draft" | "published" | "archived";
  author?: string;
  isFeatured?: boolean;
  viewCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private readonly blogModel: Model<Blog>,
  ) {}

  async getAll(query: Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const limit = Math.max(1, Number(query.limit ?? "12") || 12);
    const search = (query.search ?? "").toLowerCase().trim();
    const status = query.status;
    const category = query.category;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }
    if (status) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }

    const totalResults = await this.blogModel.countDocuments(filter);
    const items = await this.blogModel
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
        blogs: items.map((item) => this.toBlogResponse(item)),
      },
    };
  }

  async getPublished(query: Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const limit = Math.max(1, Number(query.limit ?? "12") || 12);

    const filter: Record<string, unknown> = { status: "published" };

    const totalResults = await this.blogModel.countDocuments(filter);
    const items = await this.blogModel
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
        blogs: items.map((item) => this.toBlogResponse(item)),
      },
    };
  }

  async getFeatured() {
    const blogs = await this.blogModel
      .find({ isFeatured: true, status: "published" })
      .limit(6)
      .sort({ createdAt: -1 })
      .lean();

    return {
      data: {
        blogs: blogs.map((item) => this.toBlogResponse(item)),
      },
    };
  }

  async getById(id: string) {
    const blog = await this.blogModel.findById(id).lean();
    return blog
      ? {
          data: {
            blog: this.toBlogResponse(blog),
          },
        }
      : null;
  }

  async getBySlug(slug: string) {
    const blog = await this.blogModel.findOne({ slug }).lean();
    if (blog) {
      // Increment view count
      await this.blogModel.findByIdAndUpdate(blog._id, {
        $inc: { viewCount: 1 },
      });
    }
    return blog
      ? {
          data: {
            blog: this.toBlogResponse(blog),
          },
        }
      : null;
  }

  async create(dto: UpsertBlogDto) {
    const baseSlug = generateSlug(dto.title);
    const existingSlugs = await this.blogModel
      .find({ slug: { $regex: `^${baseSlug}(-[0-9]+)?$` } })
      .select("slug")
      .lean();
    const existingSlugsArray = existingSlugs.map((b) => b.slug);
    const uniqueSlug = await ensureUniqueSlug(baseSlug, existingSlugsArray);

    const newBlog = await this.blogModel.create({
      title: dto.title,
      slug: uniqueSlug,
      content: dto.content,
      excerpt: dto.excerpt ?? "",
      coverImage: dto.coverImage,
      category: dto.category ?? "General",
      tags: dto.tags ?? [],
      status: dto.status ?? "draft",
      author: dto.author ?? "",
      isFeatured: dto.isFeatured ?? false,
      viewCount: 0,
    });

    return {
      message: "Blog created",
      data: {
        blog: this.toBlogResponse(newBlog.toObject()),
      },
    };
  }

  async update(id: string, dto: UpsertBlogDto) {
    const updateData: Record<string, unknown> = {
      title: dto.title,
      content: dto.content,
      excerpt: dto.excerpt ?? "",
      category: dto.category ?? "General",
      tags: dto.tags ?? [],
      status: dto.status ?? "draft",
      author: dto.author ?? "",
      isFeatured: dto.isFeatured ?? false,
    };

    if (dto.coverImage) {
      updateData.coverImage = dto.coverImage;
    }

    const target = await this.blogModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean();

    if (!target) {
      return null;
    }

    return {
      message: "Blog updated",
      data: {
        blog: this.toBlogResponse(target),
      },
    };
  }

  async remove(id: string) {
    const result = await this.blogModel.findByIdAndDelete(id);
    return Boolean(result);
  }

  private toBlogResponse(blog: BlogResponseInput) {
    return {
      _id: String(blog._id),
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt ?? "",
      coverImage: blog.coverImage,
      category: blog.category,
      tags: blog.tags ?? [],
      status: blog.status,
      author: blog.author ?? "",
      isFeatured: blog.isFeatured ?? false,
      viewCount: blog.viewCount ?? 0,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    };
  }
}
