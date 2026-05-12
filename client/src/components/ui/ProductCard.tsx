/**
 * ProductCard Component
 * Hiển thị một sản phẩm dưới dạng card
 *
 * Lý do tách component:
 * - Dùng lại ở nhiều chỗ: shop page, homepage, featured products
 * - Dễ maintain: chỉnh sửa style/logic ở một nơi
 * - Dễ test: component nhỏ, pure, predictable
 * - Performance: có thể memoize để tránh re-render
 */

"use client";

import React, { memo } from "react";
import Image from "next/image";
import { Product } from "@/types";
import Link from "next/link";
import { buildSlugAndId } from "@/lib/slug.utils";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  isLoading?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  isLoading = false,
}: ProductCardProps) {
  const discountedPrice = product.salePrice ?? product.price;

  const outOfStock = product.availability === "Out Of Stock";
  const productUrl = `/plant/${buildSlugAndId(product.slug, product._id)}`;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full">
      {/* Image Container */}
      <div className="relative bg-gray-100 aspect-square overflow-hidden group">
        <Link href={productUrl}>
          <Image
            src={product.imageCover}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Badges */}
        {product.isFeatured && (
          <span className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
            Featured
          </span>
        )}
        {product.isFlashSale && (
          <span className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 text-xs font-bold rounded">
            Sale
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Category & Tag */}
        <div className="flex gap-2 mb-2">
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            {product.category}
          </span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {product.tag}
          </span>
        </div>

        {/* Name */}
        <Link href={productUrl}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-green-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 my-2">
            {product.description}
          </p>
        )}

        {/* Stock Info */}
        {product.stock !== undefined && (
          <p className="text-xs text-gray-500 mb-2">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
        )}

        {/* Price */}
        <div className="mt-auto mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-green-600">
              {discountedPrice.toLocaleString("vi-VN")}đ
            </span>
            {product.discountPercentage && product.discountPercentage > 0 && (
              <>
                <span className="text-sm text-gray-500 line-through">
                  {product.price.toLocaleString("vi-VN")}đ
                </span>
                <span className="text-xs text-red-500 font-bold">
                  -{product.discountPercentage}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart?.(product._id)}
          disabled={outOfStock || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded font-semibold transition-colors duration-200"
        >
          {isLoading ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";
