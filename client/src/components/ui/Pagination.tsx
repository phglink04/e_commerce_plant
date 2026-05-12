/**
 * Pagination Component
 * Điều hướng giữa các trang
 *
 * Lý do tách component:
 * - Reusable ở tất cả list pages
 * - Responsive: adjust buttons trên mobile
 * - Accessibility: keyboard navigation
 */

"use client";

import React, { memo } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const showPrevButton = currentPage > 1;
  const showNextButton = currentPage < totalPages;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!showPrevButton || isLoading}
        className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Previous
      </button>

      {/* Page Numbers */}
      {getPageNumbers().map((page, idx) => (
        <React.Fragment key={idx}>
          {page === "..." ? (
            <span className="px-2">...</span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              disabled={page === currentPage || isLoading}
              className={`px-3 py-2 rounded border transition-colors ${
                page === currentPage
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-300 hover:bg-gray-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!showNextButton || isLoading}
        className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next →
      </button>

      {/* Info */}
      <span className="text-sm text-gray-600 ml-2">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
});

Pagination.displayName = "Pagination";
