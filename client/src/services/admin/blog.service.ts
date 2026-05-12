/**
 * Blog Service
 * API calls for admin blog management
 */

import { BaseApiService } from "../base-api.service";
import { Blog, CreateBlogPayload, UpdateBlogPayload } from "@/types/blog";
import { ApiResponse } from "@/types/api";
import { API_ENDPOINTS } from "@/constants";

interface PaginatedBlogResponse {
  items: Blog[];
  totalResults: number;
  totalPages: number;
  page: number;
  limit: number;
}

class BlogService extends BaseApiService {
  /**
   * Lấy danh sách blog (admin) với phân trang và tìm kiếm
   */
  async getBlogs(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedBlogResponse> {
    const response = await this.get<{ blogs: Blog[] }>(
      API_ENDPOINTS.blogs.list,
      {
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search?.trim() || undefined,
          status: params.status || undefined,
        },
      },
    );

    return {
      items: response.data?.blogs || [],
      totalResults: response.totalResults || 0,
      totalPages: response.totalPages || 1,
      page: response.page || params.page || 1,
      limit: params.limit || 12,
    };
  }

  /**
   * Lấy blog theo ID
   */
  async getBlogById(id: string): Promise<Blog> {
    const response = await this.get<{ blog: Blog }>(
      API_ENDPOINTS.blogs.getById(id),
    );
    return response.data.blog;
  }

  /**
   * Tạo blog mới (admin only)
   */
  async createBlog(payload: CreateBlogPayload): Promise<Blog> {
    if (payload.imageFile) {
      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("content", payload.content);
      if (payload.excerpt) formData.append("excerpt", payload.excerpt);
      if (payload.category) formData.append("category", payload.category);
      if (payload.tags && payload.tags.length > 0) {
        formData.append("tags", payload.tags.join(","));
      }
      formData.append("status", payload.status || "draft");
      if (payload.author) formData.append("author", payload.author);
      formData.append("isFeatured", String(payload.isFeatured ?? false));
      if (payload.coverImage) formData.append("coverImage", payload.coverImage);
      formData.append("image", payload.imageFile);

      const response = await this.uploadFile<{ blog: Blog }>(
        API_ENDPOINTS.blogs.create,
        formData,
      );
      return response.data.blog;
    }

    const response = await this.post<{ blog: Blog }>(
      API_ENDPOINTS.blogs.create,
      {
        ...payload,
        imageFile: undefined,
        coverImage: payload.coverImage,
      },
    );
    return response.data.blog;
  }

  /**
   * Cập nhật blog (admin only)
   */
  async updateBlog(id: string, payload: UpdateBlogPayload): Promise<Blog> {
    if (payload.imageFile) {
      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("content", payload.content);
      if (payload.excerpt) formData.append("excerpt", payload.excerpt);
      if (payload.category) formData.append("category", payload.category);
      if (payload.tags && payload.tags.length > 0) {
        formData.append("tags", payload.tags.join(","));
      }
      formData.append("status", payload.status || "draft");
      if (payload.author) formData.append("author", payload.author);
      formData.append("isFeatured", String(payload.isFeatured ?? false));
      if (payload.coverImage) formData.append("coverImage", payload.coverImage);
      formData.append("image", payload.imageFile);

      const response = await this.uploadFilePatch<{ blog: Blog }>(
        API_ENDPOINTS.blogs.update(id),
        formData,
      );
      return response.data.blog;
    }

    const updateData: Record<string, unknown> = {
      title: payload.title,
      content: payload.content,
      excerpt: payload.excerpt,
      category: payload.category,
      tags: payload.tags,
      status: payload.status,
      author: payload.author,
      isFeatured: payload.isFeatured,
    };
    if (payload.coverImage) {
      updateData.coverImage = payload.coverImage;
    }

    const response = await this.patch<{ blog: Blog }>(
      API_ENDPOINTS.blogs.update(id),
      updateData,
    );
    return response.data.blog;
  }

  /**
   * Xóa blog (admin only)
   */
  async deleteBlog(id: string): Promise<void> {
    await this.delete(API_ENDPOINTS.blogs.delete(id));
  }
}

export const blogService = new BlogService();
