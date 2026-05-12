/**
 * ShopPageFeature - Ví dụ Page hoàn chỉnh
 * Sử dụng: hooks, services, components
 *
 * Data Flow:
 * 1. Component mount → useProducts hook fetch data
 * 2. User thao tác (search, filter, pagination) → update hook state
 * 3. Hook gọi productService → API call backend
 * 4. Update component state → ProductList render
 * 5. User click "Add to Cart" → useCart hook call cartService
 *
 * Props Drilling: ✅ TRÁNH - Dùng hooks thay vì props
 * Separation of Concerns: ✅ TÁCH - UI (components) vs Logic (hooks/services)
 */

"use client";

import React, { useState, useCallback } from "react";
import { useProducts, useCart } from "@/hooks";
import {
  ProductList,
  SearchBar,
  FilterSidebar,
  Pagination,
} from "@/components/ui";
import { PAGINATION } from "@/constants";

// Danh sách categories và tags (có thể fetch từ API)
const CATEGORIES = ["Succulent", "Herb", "Flower", "Tree"];
const TAGS = ["Indoor", "Outdoor"];

export default function ShopPage() {
  const [page, setPage] = useState(PAGINATION.DEFAULT_PAGE);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    tag: "",
    minPrice: 0,
    maxPrice: 1000000,
  });

  // Fetch products
  const { products, loading, error, pagination, refetch } = useProducts({
    initialPage: page,
    limit: PAGINATION.DEFAULT_LIMIT,
    search,
    category: filters.category,
    tag: filters.tag,
  });

  // Cart operations
  const { addToCart: addToCartFn } = useCart();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  // Add to cart handler
  const handleAddToCart = useCallback(
    async (productId: string) => {
      setAddingProductId(productId);
      try {
        const success = await addToCartFn(productId, 1);
        if (success) {
          // Show toast notification (implement later)
          console.log("Added to cart");
        }
      } finally {
        setAddingProductId(null);
      }
    },
    [addToCartFn],
  );

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Our Plants</h1>
          <p className="text-gray-600">
            Discover our beautiful collection of plants
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar - Hidden on mobile */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <FilterSidebar
              categories={CATEGORIES}
              tags={TAGS}
              onFilterChange={handleFilterChange}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Search Bar */}
            <div className="mb-8">
              <SearchBar onSearch={setSearch} placeholder="Search plants..." />
            </div>

            {/* Results Info */}
            <div className="mb-6 text-sm text-gray-600">
              Found {pagination.totalResults} products
              {search && ` matching "${search}"`}
            </div>

            {/* Products Grid */}
            <ProductList
              products={products}
              loading={loading}
              error={error}
              onAddToCart={handleAddToCart}
              addingProductId={addingProductId}
              onRetry={refetch}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                isLoading={loading}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
