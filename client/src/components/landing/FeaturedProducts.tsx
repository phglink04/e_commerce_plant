"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  ShoppingCart,
  Star,
  X,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/api";
import type { PlantProduct } from "@/components/landing/types";
import {
  calcDiscountedPrice,
  enrichProduct,
  normalizeImageSrc,
  formatCurrency,
} from "@/utils/utils";
import { useHomeUiStore } from "@/store/home-ui-store";
import { useAuthStore } from "@/store/auth-store";

type GridConfig = { rows?: number; columns?: number };

type FeaturedProductsProps = {
  selectedCategory: string;
  onProductsLoaded?: (products: PlantProduct[]) => void;
  gridConfig?: GridConfig;
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export default function FeaturedProducts({
  selectedCategory,
  onProductsLoaded,
  gridConfig,
}: FeaturedProductsProps) {
  const { token } = useAuthStore();
  const { incrementCart } = useHomeUiStore();

  const columns = gridConfig?.columns ?? 4;
  const rows = gridConfig?.rows ?? 2;
  const maxItems = rows * columns;
  const skeletonRows = Array.from({ length: maxItems }, (_, i) => `skeleton-${i}`);

  const [products, setProducts] = useState<PlantProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeQuickView, setActiveQuickView] = useState<PlantProduct | null>(
    null,
  );

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/plants/featured-products");
      const fromFeatured = (response.data?.data?.plants ??
        response.data?.data ??
        []) as PlantProduct[];

      const result = fromFeatured.length
        ? fromFeatured
        : ((await api.get("/api/plants?page=1&limit=12")).data?.data?.plants ??
          []);

      const enriched = (result as PlantProduct[]).map(enrichProduct);
      setProducts(enriched);
      onProductsLoaded?.(enriched);
    } catch {
      setError("Không thể tải sản phẩm nổi bật.");
      setProducts([]);
      onProductsLoaded?.([]);
    } finally {
      setLoading(false);
    }
  }, [onProductsLoaded]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    if (selectedCategory === "All") return products.slice(0, maxItems);

    const selected = selectedCategory.toLowerCase();
    return products.filter((item) => {
      const cat = (item.category ?? "").toLowerCase();
      const tag = (item.tag ?? "").toLowerCase();
      return (
        cat === selected ||
        tag === selected ||
        cat.includes(selected) ||
        tag.includes(selected)
      );
    });
  }, [products, selectedCategory]);

  const handleAddToCart = async (product: PlantProduct) => {
    incrementCart(1);
    if (!token) return;
    try {
      await api.post(
        "/api/users/addtocart",
        { plantId: product._id, quantity: 1, price: product.price },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      // Keep UX responsive even if backend cart sync fails.
    }
  };

  const getProductUrl = (product: PlantProduct) => {
    if (product.slug) return `/plant/${product.slug}-${product._id}`;
    return `/plant/${product._id}`;
  };

  return (
    <section className="px-4 py-16 md:px-6" id="featured-products">
      <div className="mx-auto w-full max-w-[1320px]">
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Sản phẩm nổi bật
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
              Bán chạy nhất dành cho bạn
            </h2>
            <div className="hp-section-divider" />
          </div>
          <Link
            href="/shop"
            className="group mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700 md:mt-0"
          >
            Xem tất cả sản phẩm
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </motion.div>

        {/* ── Loading Skeleton ── */}
        {loading ? (
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {skeletonRows.map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-3"
              >
                <div className="pw-shimmer h-52 rounded-xl" />
                <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-2/5 rounded bg-slate-100" />
                <div className="mt-4 h-10 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : null}

        {/* ── Error ── */}
        {!loading && error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {/* ── Product Grid (Shop-style cards) ── */}
        {!loading && !error ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            style={{ display: 'grid', gap: '1rem', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {filtered.map((product) => {
              const discount = product.discountPercentage ?? 0;
              const discountedPrice = calcDiscountedPrice(product.price, discount);
              const imageSrc = normalizeImageSrc(product.imageCover);
              const outOfStock = product.availability === "Out Of Stock";
              const productUrl = getProductUrl(product);

              return (
                <motion.article
                  key={product._id}
                  variants={cardVariants}
                  className="group overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg flex flex-col h-full"
                >
                  {/* Image Container */}
                  <div className="relative bg-gray-100 aspect-square overflow-hidden">
                    <Link href={productUrl}>
                      <Image
                        src={imageSrc}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>

                    {/* Badges */}
                    {product.isFeatured && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                        Nổi bật
                      </span>
                    )}
                    {product.isFlashSale && (
                      <span className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 text-xs font-bold rounded">
                        Giảm giá
                      </span>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold">Hết hàng</span>
                      </div>
                    )}

                    {/* Quick View button */}
                    <div className="absolute right-3 bottom-3 flex flex-col gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setActiveQuickView(product)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-slate-600 shadow-md backdrop-blur transition hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col">
                    {/* Category & Tag */}
                    <div className="flex gap-2 mb-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {product.category ?? "Cây cảnh"}
                      </span>
                      {product.tag && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {product.tag}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <Link href={productUrl}>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-green-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Stock Info */}
                    {product.stock !== undefined && (
                      <p className="text-xs text-gray-500 mt-1">
                        {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-auto mb-3 pt-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(discountedPrice)}
                        </span>
                        {discount > 0 && (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="text-xs text-red-500 font-bold">
                              -{discount}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={() => void handleAddToCart(product)}
                      disabled={outOfStock}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded font-semibold transition-colors duration-200"
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        ) : null}
      </div>

      {/* ── Quick View Modal ── */}
      <AnimatePresence>
        {activeQuickView ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={() => setActiveQuickView(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-5 shadow-2xl md:p-7"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveQuickView(null)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={18} />
              </button>

              <div className="grid gap-5 md:grid-cols-2">
                <Image
                  src={normalizeImageSrc(activeQuickView.imageCover)}
                  alt={activeQuickView.name}
                  width={560}
                  height={560}
                  className="h-64 w-full rounded-2xl object-cover md:h-80"
                />
                <div className="flex flex-col justify-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
                    {activeQuickView.category ?? "Cây cảnh"}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900">
                    {activeQuickView.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={`qv-star-${idx}`}
                        size={14}
                        className={
                          idx < Math.round(activeQuickView.rating ?? 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    {activeQuickView.shortDescription ??
                      "Cây cảnh khỏe mạnh, được chọn lọc kỹ lưỡng, sẵn sàng mang sự tươi mát đến không gian của bạn."}
                  </p>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(
                        calcDiscountedPrice(
                          activeQuickView.price,
                          activeQuickView.discountPercentage ?? 0,
                        ),
                      )}
                    </span>
                    {(activeQuickView.discountPercentage ?? 0) > 0 && (
                      <span className="text-base text-slate-400 line-through">
                        {formatCurrency(activeQuickView.price)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void handleAddToCart(activeQuickView);
                      setActiveQuickView(null);
                    }}
                    className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 hover:brightness-105"
                  >
                    <ShoppingCart size={16} />
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
