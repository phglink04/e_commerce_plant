/**
 * Product Service
 * Tất cả API calls liên quan đến sản phẩm
 */

import { BaseApiService } from "./base-api.service";
import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  PaginatedResponse,
  PaginationParams,
} from "@/types";
import { API_ENDPOINTS } from "@/constants";

class ProductService extends BaseApiService {
  /**
   * Lấy danh sách sản phẩm với phân trang, tìm kiếm, lọc
   * @param params - Tham số phân trang, tìm kiếm, lọc
   */
  async getProducts(
    params: PaginationParams,
  ): Promise<PaginatedResponse<Product>> {
    const response = await this.get<{
      plants: Product[];
    }>(API_ENDPOINTS.products.list, {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search?.trim() || undefined,
        category: params.category,
        tag: params.tag,
        availability: params.availability,
        admin: params.admin ? "true" : undefined,
        includeDiscontinued: params.includeDiscontinued ? "true" : undefined,
        isFeatured: params.isFeatured ? "true" : params.isFeatured === false ? "false" : undefined,
        isFlashSale: params.isFlashSale ? "true" : params.isFlashSale === false ? "false" : undefined,
        lowStock: params.lowStock ? "true" : undefined,
      },
    });

    return {
      items: response.data.plants || [],
      totalResults: response.totalResults || 0,
      totalPages: response.totalPages || 1,
      page: response.page || params.page,
      limit: response.limit || params.limit,
    };
  }

  /**
   * Lấy sản phẩm nổi bật
   */
  async getFeaturedProducts(limit = 6): Promise<Product[]> {
    const response = await this.get<Product[]>(
      API_ENDPOINTS.products.featured,
      {
        params: { limit },
      },
    );
    return response.data || [];
  }

  /**
   * Lấy sản phẩm flash sale
   */
  async getFlashSaleProducts(limit = 6): Promise<Product[]> {
    const response = await this.get<Product[]>(
      API_ENDPOINTS.products.flashSale,
      {
        params: { limit },
      },
    );
    return response.data || [];
  }

  /**
   * Lấy chi tiết sản phẩm
   */
  async getProductById(id: string): Promise<Product> {
    const response = await this.get<Product>(
      API_ENDPOINTS.products.getById(id),
    );
    return response.data;
  }

  /**
   * Tạo sản phẩm mới (admin only)
   */
  async createProduct(payload: CreateProductPayload): Promise<Product> {
    if (payload.imageFile) {
      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("category", payload.category);
      formData.append("price", String(payload.price));
      formData.append("costPrice", String(payload.costPrice ?? 0));
      formData.append("availability", payload.availability);
      if (payload.tags && payload.tags.length > 0) {
        payload.tags.forEach((t) => formData.append("tags[]", t));
      }
      formData.append("stock", String(payload.stock ?? 0));
      formData.append("isFeatured", String(payload.isFeatured ?? false));
      formData.append("isFlashSale", String(payload.isFlashSale ?? false));
      formData.append(
        "discountPercentage",
        String(payload.discountPercentage ?? 0),
      );
      if (payload.description) {
        formData.append("description", payload.description);
      }
      formData.append("image", payload.imageFile);

      const response = await this.uploadFile<Product>(
        API_ENDPOINTS.products.create,
        formData,
      );
      return response.data;
    }

    // Nếu không có file, gửi JSON — strip imageFile to avoid forbidNonWhitelisted
    const { imageFile, ...jsonPayload } = payload;
    const response = await this.post<Product>(
      API_ENDPOINTS.products.create,
      jsonPayload,
    );
    return response.data;
  }

  /**
   * Cập nhật sản phẩm (admin only)
   */
  async updateProduct(
    id: string,
    payload: UpdateProductPayload,
  ): Promise<Product> {
    if (payload.imageFile) {
      const formData = new FormData();
      if (payload.name !== undefined) formData.append("name", payload.name);
      if (payload.category !== undefined)
        formData.append("category", payload.category);
      if (payload.price !== undefined)
        formData.append("price", String(payload.price));
      if (payload.costPrice !== undefined)
        formData.append("costPrice", String(payload.costPrice));
      if (payload.availability !== undefined)
        formData.append("availability", payload.availability);
      if (payload.tags && payload.tags.length > 0) {
        payload.tags.forEach((t) => formData.append("tags[]", t));
      }
      if (payload.stock !== undefined)
        formData.append("stock", String(payload.stock));
      if (payload.isFeatured !== undefined)
        formData.append("isFeatured", String(payload.isFeatured));
      if (payload.isFlashSale !== undefined)
        formData.append("isFlashSale", String(payload.isFlashSale));
      if (payload.discountPercentage !== undefined)
        formData.append(
          "discountPercentage",
          String(payload.discountPercentage),
        );
      if (payload.description !== undefined)
        formData.append("description", payload.description);
      formData.append("image", payload.imageFile);

      const response = await this.uploadFilePatch<Product>(
        API_ENDPOINTS.products.update(id),
        formData,
      );
      return response.data;
    }

    // Chỉ update các trường không phải file
    const updateData: Record<string, any> = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.costPrice !== undefined) updateData.costPrice = payload.costPrice;
    if (payload.availability !== undefined)
      updateData.availability = payload.availability;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    if (payload.stock !== undefined) updateData.stock = payload.stock;
    if (payload.isFeatured !== undefined)
      updateData.isFeatured = payload.isFeatured;
    if (payload.isFlashSale !== undefined)
      updateData.isFlashSale = payload.isFlashSale;
    if (payload.discountPercentage !== undefined)
      updateData.discountPercentage = payload.discountPercentage;
    if (payload.description !== undefined)
      updateData.description = payload.description;
    if (payload.imageCover !== undefined)
      updateData.imageCover = payload.imageCover;

    const response = await this.patch<Product>(
      API_ENDPOINTS.products.update(id),
      updateData,
    );
    return response.data;
  }

  /**
   * Xóa sản phẩm (admin only)
   */
  async deleteProduct(id: string): Promise<void> {
    await this.delete(API_ENDPOINTS.products.delete(id));
  }
}

// Export singleton instance
export const productService = new ProductService();
