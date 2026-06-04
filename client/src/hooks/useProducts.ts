/**
 * useProducts - Hook để fetch và quản lý danh sách sản phẩm
 * Xử lý: phân trang, tìm kiếm, lọc, loading, error
 */

import { useState, useCallback, useEffect } from "react";
import { productService } from "@/services";
import {
  Product,
  PaginationParams,
  PaginatedResponse,
  ApiError,
} from "@/types";
import { PAGINATION } from "@/constants";

interface UseProductsState {
  products: Product[];
  loading: boolean;
  error: ApiError | null;
  pagination: {
    page: number;
    limit: number;
    totalResults: number;
    totalPages: number;
  };
}

interface UseProductsOptions {
  initialPage?: number;
  limit?: number;
  search?: string;
  category?: string;
  tag?: string;
  admin?: boolean;
  availability?: string;
}

export function useProducts(options: UseProductsOptions = {}) {
  const {
    initialPage = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search = "",
    category = "",
    tag = "",
    admin = false,
    availability = "",
  } = options;

  const [state, setState] = useState<UseProductsState>({
    products: [],
    loading: true,
    error: null,
    pagination: {
      page: initialPage,
      limit,
      totalResults: 0,
      totalPages: 0,
    },
  });

  // Fetch sản phẩm
  const fetchProducts = useCallback(
    async (page: number) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await productService.getProducts({
          page,
          limit,
          search,
          category,
          tag,
          availability: availability || undefined,
          admin,
        } as PaginationParams);

        setState((prev) => ({
          ...prev,
          products: response.items,
          pagination: {
            page: response.page,
            limit: response.limit,
            totalResults: response.totalResults,
            totalPages: response.totalPages,
          },
          loading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err as ApiError,
          loading: false,
        }));
      }
    },
    [limit, search, category, tag, availability],
  );

  // Fetch khi component mount hoặc khi dependencies thay đổi
  useEffect(() => {
    fetchProducts(initialPage);
  }, [initialPage, fetchProducts]);

  // Handlers
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= state.pagination.totalPages) {
        fetchProducts(page);
      }
    },
    [state.pagination.totalPages, fetchProducts],
  );

  const nextPage = useCallback(() => {
    const nextPage = state.pagination.page + 1;
    if (nextPage <= state.pagination.totalPages) {
      fetchProducts(nextPage);
    }
  }, [state.pagination.page, state.pagination.totalPages, fetchProducts]);

  const prevPage = useCallback(() => {
    const prevPage = state.pagination.page - 1;
    if (prevPage >= 1) {
      fetchProducts(prevPage);
    }
  }, [state.pagination.page, fetchProducts]);

  const refetch = useCallback(() => {
    fetchProducts(state.pagination.page);
  }, [state.pagination.page, fetchProducts]);

  return {
    ...state,
    goToPage,
    nextPage,
    prevPage,
    refetch,
  };
}
