/**
 * ProductList Component
 * Hiển thị danh sách sản phẩm dưới dạng grid
 *
 * Lý do tách component:
 * - Layout quản lý ở một nơi (responsive grid)
 * - Loading skeleton state
 * - Error state handling
 * - Dễ mở rộng (thêm sorting, view mode, etc.)
 */

"use client";

import React, { memo } from "react";
import { Product, ApiError } from "@/types";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

interface ProductListProps {
  products: Product[];
  loading?: boolean;
  error?: ApiError | null;
  onAddToCart?: (productId: string) => void;
  addingProductId?: string | null;
  onRetry?: () => void;
}

export const ProductList = memo(function ProductList({
  products,
  loading = false,
  error = null,
  onAddToCart,
  addingProductId = null,
  onRetry,
}: ProductListProps) {
  if (error && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-500 text-xl mb-4">❌ {error.message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (loading && products.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onAddToCart={onAddToCart}
          isLoading={addingProductId === product._id}
        />
      ))}
    </div>
  );
});

ProductList.displayName = "ProductList";
