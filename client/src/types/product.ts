/**
 * Product Types
 * Định nghĩa cấu trúc sản phẩm
 */

export interface Product {
  _id: string;
  slug: string;
  name: string;
  imageCover: string;
  category: string;
  price: number;
  costPrice?: number;
  salePrice?: number;
  availability: "In Stock" | "Out Of Stock" | "Up Coming";
  tags: string[];
  description?: string;
  stock?: number;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  discountPercentage?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  name: string;
  imageCover?: string;
  imageFile?: File | null;
  category: string;
  price: number;
  costPrice?: number;
  availability: "In Stock" | "Out Of Stock" | "Up Coming";
  tags?: string[];
  description?: string;
  stock?: number;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  discountPercentage?: number;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  _id?: string;
}

export interface ProductFilter {
  search?: string;
  category?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string;
  isFeatured?: boolean;
  isFlashSale?: boolean;
}
