"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { CategoryItem } from "@/components/landing/types";

type GridConfig = { rows?: number; columns?: number };

type CategorySectionProps = {
  categories: CategoryItem[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  gridConfig?: GridConfig;
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export default function CategorySection({
  categories,
  selectedCategory,
  onCategoryChange,
  gridConfig,
}: CategorySectionProps) {
  const router = useRouter();
  const columns = gridConfig?.columns ?? 5;
  const rows = gridConfig?.rows ?? 1;
  const maxItems = rows * columns;
  const displayCategories = categories.slice(0, maxItems);

  const handleCategoryClick = (name: string) => {
    onCategoryChange(name);
    router.push(`/shop?category=${encodeURIComponent(name)}`);
  };

  return (
    <section id="categories" className="px-4 py-16 md:px-6">
      <div className="mx-auto w-full max-w-[1320px]">
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-1 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
             Khám phá theo danh mục
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
              Tìm cây xanh phù hợp dành cho bạn
            </h2>
            <div className="hp-section-divider" />
          </div>

        </motion.div>

        {/* ── Category Grid ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2 md:grid md:overflow-visible"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {displayCategories.map((item) => {
            const isActive = selectedCategory === item.name;

            return (
              <motion.button
                key={item.id}
                type="button"
                variants={cardVariants}
                whileHover={{ y: -6 }}
                onClick={() => handleCategoryClick(item.name)}
                className={`hp-card-shine group relative min-w-[200px] snap-start overflow-hidden rounded-2xl text-left shadow-sm transition-all duration-300 md:min-w-0 ${
                  isActive
                    ? "ring-2 ring-emerald-500 ring-offset-2 shadow-emerald-100"
                    : "border border-slate-100 hover:shadow-lg"
                }`}
              >
                {/* Image */}
                <div className="relative h-40 w-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 200px, (max-width: 1200px) 33vw, 20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Category icon */}
                  <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-lg shadow-sm backdrop-blur">
                    {item.icon ?? "🌿"}
                  </div>

                  {/* Product count */}
                  <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
                    {item.productCount}+ sản phẩm
                  </div>
                </div>

                {/* Card body */}
                <div className="bg-white p-3.5">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {isActive ? "✓ Đang xem" : "Xem tất cả →"}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

