/**
 * FilterSidebar Component
 * Sidebar để lọc sản phẩm theo category, tag, giá
 *
 * Lý do tách component:
 * - Quản lý state filter ở một nơi
 * - Responsive: ẩn/hiện trên mobile
 * - Dễ scale: thêm filters mới
 */

"use client";

import React, { useState } from "react";

interface FilterSidebarProps {
  categories: string[];
  tags: string[];
  onFilterChange: (filters: {
    category?: string;
    tag?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
}

export function FilterSidebar({
  categories,
  tags,
  onFilterChange,
}: FilterSidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });

  const handleCategoryChange = (category: string) => {
    const newCategory = selectedCategory === category ? undefined : category;
    setSelectedCategory(newCategory);
    onFilterChange({
      category: newCategory,
      tag: selectedTag,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    });
  };

  const handleTagChange = (tag: string) => {
    const newTag = selectedTag === tag ? undefined : tag;
    setSelectedTag(newTag);
    onFilterChange({
      category: selectedCategory,
      tag: newTag,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    });
  };

  const handlePriceChange = (type: "min" | "max", value: number) => {
    const newRange = { ...priceRange, [type]: value };
    setPriceRange(newRange);
    onFilterChange({
      category: selectedCategory,
      tag: selectedTag,
      minPrice: newRange.min,
      maxPrice: newRange.max,
    });
  };

  const handleReset = () => {
    setSelectedCategory(undefined);
    setSelectedTag(undefined);
    setPriceRange({ min: 0, max: 1000000 });
    onFilterChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 h-fit">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Độc lọc</h3>
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Reset
        </button>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="font-semibold text-sm mb-3">Danh mục</h4>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategory === cat}
                onChange={() => handleCategoryChange(cat)}
                className="w-4 h-4"
              />
              <span className="text-sm">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <h4 className="font-semibold text-sm mb-3">Đường khỏ</h4>
        <div className="space-y-2">
          {tags.map((tag) => (
            <label key={tag} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTag === tag}
                onChange={() => handleTagChange(tag)}
                className="w-4 h-4"
              />
              <span className="text-sm">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Khoảng giá</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600">Giá tối thiểu</label>
            <input
              type="range"
              min="0"
              max="1000000"
              step="10000"
              value={priceRange.min}
              onChange={(e) => handlePriceChange("min", Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-700">
              {priceRange.min.toLocaleString("vi-VN")}đ
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600">Giá tối đa</label>
            <input
              type="range"
              min="0"
              max="1000000"
              step="10000"
              value={priceRange.max}
              onChange={(e) => handlePriceChange("max", Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-700">
              {priceRange.max.toLocaleString("vi-VN")}đ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
