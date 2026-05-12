"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import api from "@/lib/api";

type Stats = {
  totalPlants: number;
  inStock: number;
  averagePrice: number;
};

type HeroConfig = { title?: string; subtitle?: string; bannerImage?: string };

export default function HeroSection({ config }: { config?: HeroConfig }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/api/plants/plant-stats");
        const data = response.data?.data as Stats | undefined;
        if (data) setStats(data);
      } catch {
        // Fallback handled via defaults below
      }
    };

    void fetchStats();
  }, []);

  const displayStats = [
    {
      label: "Products",
      value: stats ? `${stats.totalPlants}+` : "200+",
      emoji: "🌿",
    },
    {
      label: "In Stock",
      value: stats ? `${stats.inStock}` : "150+",
      emoji: "📦",
    },
    {
      label: "Avg. Price",
      value: stats
        ? `${Math.round(stats.averagePrice / 1000)}K đ`
        : "...",
      emoji: "💰",
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 md:px-6 md:pt-14">
      {/* ── Background decorations ── */}
      <div className="pointer-events-none absolute -left-32 -top-20 h-[440px] w-[440px] rounded-full bg-emerald-200/25 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 top-10 h-[380px] w-[380px] rounded-full bg-lime-200/30 blur-[100px]" />
      <div className="hp-blob pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 bg-emerald-300/15 blur-[80px]" />

      <div className="mx-auto grid w-full max-w-[1320px] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        {/* ── Left content ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="relative z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700 shadow-sm backdrop-blur">
              <Sparkles size={13} className="text-emerald-500" />
              Seasonal picks live now
            </span>
          </motion.div>

          {/* Heading */}
          <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 md:text-5xl lg:text-[3.4rem]">
            {config?.title ? (
              <span className="hp-gradient-text">{config.title}</span>
            ) : (
              <>
                Grow Your Own
                <br />
                <span className="hp-gradient-text">Green Paradise</span>
              </>
            )}{" "}
            <span className="inline-block origin-bottom-right animate-[hp-float_3s_ease-in-out_infinite] text-4xl md:text-5xl">
              🌿
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-500 md:text-[1.05rem]">
            {config?.subtitle || "Premium indoor and outdoor plants delivered to your door with expert care guidance, secure plant-safe packaging, and a 30-day health guarantee."}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-7 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(16,185,129,0.35)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(16,185,129,0.45)]"
            >
              <span className="relative z-10">Shop Now</span>
              <ArrowRight
                size={16}
                className="relative z-10 transition-transform group-hover:translate-x-1"
              />
              <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)] opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            <Link
              href="#categories"
              className="inline-flex h-12 items-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Explore Categories
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
            {displayStats.map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="rounded-2xl border border-slate-100 bg-white/90 px-3 py-3.5 shadow-sm backdrop-blur"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{item.emoji}</span>
                  <p className="text-xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Right hero image ── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.12 }}
          className="relative z-10"
        >
          <div className="relative mx-auto max-w-[520px]">
            {/* Main image container */}
            <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/40 p-2.5 shadow-[0_20px_60px_rgba(5,46,22,0.18)] backdrop-blur">
              <Image
                src={config?.bannerImage || "/frontend/HomePage/landingImage.webp"}
                alt="Premium featured plant"
                width={840}
                height={840}
                priority
                className="h-[420px] w-full rounded-[26px] object-cover md:h-[500px]"
              />
            </div>

            {/* Floating card — price */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                repeat: Infinity,
                duration: 4.5,
                ease: "easeInOut",
              }}
              className="absolute -left-6 top-10 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-xl backdrop-blur"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Starting from
              </p>
              <p className="mt-0.5 text-xl font-bold text-slate-900">
                {stats
                  ? `${(Math.min(...[stats.averagePrice]) / 1000).toFixed(0)}K đ`
                  : "$24.99"}
              </p>
            </motion.div>

            {/* Floating card — rating */}
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut",
              }}
              className="absolute -right-4 bottom-24 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-xl backdrop-blur md:-right-6"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Customer rating
              </p>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-lg font-bold text-amber-500">
                  ★★★★★
                </span>
                <span className="text-xs text-slate-500">(4.9)</span>
              </div>
            </motion.div>

            {/* Floating badge — discount */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 3.5,
                ease: "easeInOut",
              }}
              className="absolute right-6 top-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-500/30"
            >
              -30% TODAY
            </motion.div>
          </div>

          <div className="leaf-float pointer-events-none absolute -bottom-6 left-6 h-20 w-20 rounded-full bg-emerald-300/20 blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
}
