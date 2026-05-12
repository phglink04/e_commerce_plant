/**
 * ProductCardSkeleton Component
 * Loading skeleton cho ProductCard
 */

"use client";

import React from "react";

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image Skeleton */}
      <div className="bg-gray-300 aspect-square animate-pulse" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-6 w-12 bg-gray-300 rounded animate-pulse" />
          <div className="h-6 w-12 bg-gray-300 rounded animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse" />
        </div>

        {/* Price */}
        <div className="h-6 w-1/2 bg-gray-300 rounded animate-pulse" />

        {/* Button */}
        <div className="h-10 w-full bg-gray-300 rounded animate-pulse" />
      </div>
    </div>
  );
}
