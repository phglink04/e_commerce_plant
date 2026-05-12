/**
 * SearchBar Component
 * Thanh tìm kiếm sản phẩm với debounce
 *
 * Lý do tách component:
 * - Reusable ở nhiều page
 * - Tối ưu search với debounce (không spam API)
 * - Có thể thêm autocomplete, suggestions
 */

"use client";

import React, { useState, useEffect } from "react";
import { useDebounce } from "@/hooks";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceDelay?: number;
}

export function SearchBar({
  onSearch,
  placeholder = "Search products...",
  debounceDelay = 500,
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, debounceDelay);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/20"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}
