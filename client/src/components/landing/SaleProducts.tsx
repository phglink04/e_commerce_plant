"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Flame, ShoppingCart, Zap } from "lucide-react";
import api from "@/lib/api";
import {
  calcDiscountedPrice,
  normalizeImageSrc,
  safeDiscount,
  safeRating,
  formatCurrency,
} from "@/utils/utils";
import { useHomeUiStore } from "@/store/home-ui-store";
import { useAuthStore } from "@/store/auth-store";

type SaleProduct = {
  _id: string;
  name: string;
  slug?: string;
  price: number;
  imageCover: string;
  discountPercentage: number;
  rating?: number;
  category?: string;
  tag?: string;
  availability?: string;
  stock?: number;
  isFeatured?: boolean;
  isFlashSale?: boolean;
};

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const getCountdown = (targetDate: number): Countdown => {
  const diff = Math.max(0, targetDate - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
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

type GridConfig = {
  rows?: number;
  columns?: number;
  countdownEndDate?: string;
  discountPercent?: number;
};

export default function SaleProducts({ gridConfig }: { gridConfig?: GridConfig }) {
  const { token } = useAuthStore();

  const columns = gridConfig?.columns ?? 4;
  const rows = gridConfig?.rows ?? 1;
  const maxItems = rows * columns;
  const skeletonKeys = Array.from({ length: maxItems }, (_, i) => `sale-skel-${i}`);

  // Use admin-configured end date or fallback to 48h from now
  const [target] = useState(() => {
    if (gridConfig?.countdownEndDate) {
      const d = new Date(gridConfig.countdownEndDate).getTime();
      if (!isNaN(d) && d > Date.now()) return d;
    }
    return Date.now() + 1000 * 60 * 60 * 48;
  });
  const [countdown, setCountdown] = useState<Countdown>(() => getCountdown(target));
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxDiscount, setMaxDiscount] = useState(
    gridConfig?.discountPercent && gridConfig.discountPercent > 0
      ? gridConfig.discountPercent
      : 45,
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown(target));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/plants/flash-sale");
        const plants = (response.data?.data?.plants ?? []) as SaleProduct[];

        const enriched = plants.map((p) => ({
          ...p,
          discountPercentage: safeDiscount(p.discountPercentage),
          rating: safeRating(p.rating),
        }));

        setProducts(enriched.slice(0, maxItems));

        // Only auto-calc discount if admin didn't set one
        if (!(gridConfig?.discountPercent && gridConfig.discountPercent > 0) && enriched.length > 0) {
          const max = Math.max(
            ...enriched.map((p) => p.discountPercentage || 0),
          );
          if (max > 0) setMaxDiscount(max);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchFlashSale();
  }, []);

  const handleAddToCart = useCallback(
    async (product: SaleProduct) => {
      if (!token) {
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return;
      }
      try {
        const salePrice = calcDiscountedPrice(product.price, product.discountPercentage);
        const response = await api.post(
          "/api/users/addtocart",
          { plantId: product._id, quantity: 1, price: salePrice },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        // Update cart count immediately from response
        const cart = response.data?.data?.cart ?? [];
        if (cart && Array.isArray(cart)) {
          useHomeUiStore.getState().setCartCount(cart.length);
        }
      } catch {
        /* keep UX responsive */
      }
    },
    [token],
  );

  const getProductUrl = (product: SaleProduct) => {
    if (product.slug) return `/plant/${product.slug}-${product._id}`;
    return `/plant/${product._id}`;
  };

  const countdownUnits = [
    { label: "Ngày", value: countdown.days },
    { label: "Giờ", value: countdown.hours },
    { label: "Phút", value: countdown.minutes },
    { label: "Giây", value: countdown.seconds },
  ];

  return (
    <section className="px-4 py-16 md:px-6" id="sale-products">
      <div className="mx-auto w-full max-w-[1320px]">
        {/* ── Header Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white shadow-2xl md:p-8"
        >
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-lime-400/15 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-300">
                <Flame size={14} className="animate-pulse" />
                Flash Sale — Giảm đến {maxDiscount}%
              </div>
              <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                Đừng Bỏ Lỡ
                <br />
                <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">
                  Ưu Đãi Tuyệt Vời
                </span>
              </h2>
              <p className="mt-2 max-w-lg text-sm text-slate-300/90">
                Giảm giá có thời hạn cho cây cảnh cao cấp, chậu thông minh và
                combo theo mùa. Nhanh tay kẻo hết!
              </p>
            </div>

            {/* Countdown */}
            <div className="flex flex-col items-start gap-4 md:items-end">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-300/80">
                <Clock size={14} />
                Kết thúc sau
              </div>
              <div className="grid grid-cols-4 gap-2">
                {countdownUnits.map((item) => (
                  <div key={item.label} className="hp-countdown-unit">
                    <p className="hp-countdown-digit text-white">
                      {String(item.value).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-emerald-200/70">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/shop?deal=true"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 hover:brightness-110"
              >
                <Zap size={15} />
                Xem tất cả ưu đãi
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Sale Product Grid (Shop-style cards) ── */}
        <div className="mt-8">
          {loading ? (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {skeletonKeys.map((key) => (
                <div
                  key={key}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-3"
                >
                  <div className="pw-shimmer h-48 rounded-xl" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-2/5 rounded bg-slate-100" />
                  <div className="mt-4 h-10 rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              style={{ display: 'grid', gap: '1rem', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {products.map((product) => {
                const discount = product.discountPercentage;
                const salePrice = calcDiscountedPrice(product.price, discount);
                const imageSrc = normalizeImageSrc(product.imageCover);
                const outOfStock = product.availability === "Out Of Stock";
                const productUrl = getProductUrl(product);

                return (
                  <motion.article
                    key={product._id}
                    variants={cardVariants}
                    className="group overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md transition-shadow hover:shadow-lg flex flex-col h-full"
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
                      <span className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 text-xs font-bold rounded">
                        -{discount}%
                      </span>
                      {product.isFeatured && (
                        <span className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                          Nổi bật
                        </span>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold">Hết hàng</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col">
                      {/* Category */}
                      <div className="flex gap-2 mb-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {product.category ?? "Cây cảnh"}
                        </span>
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
                            {formatCurrency(salePrice)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                        {/* Savings tag */}
                        <div className="mt-1 inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Tiết kiệm {formatCurrency(product.price - salePrice)}
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
      </div>
    </section>
  );
}
