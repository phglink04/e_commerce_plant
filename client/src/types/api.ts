/**
 * API Response Types
 * Định nghĩa cấu trúc dữ liệu trả về từ backend
 */

export interface ApiResponse<T> {
  message?: string;
  data: T;
  totalResults?: number;
  totalPages?: number;
  page?: number;
  limit?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  data?: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string;
  admin?: boolean;
  includeDiscontinued?: boolean;
  isFeatured?: boolean;
  isFlashSale?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalResults: number;
  totalPages: number;
  page: number;
  limit: number;
}
