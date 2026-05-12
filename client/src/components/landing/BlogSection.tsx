"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, BookOpen } from "lucide-react";
import api from "@/lib/api";
import { blogPosts } from "@/lib/mock-content";
import type { BlogPreview } from "@/components/landing/types";

type ApiBlog = {
  _id?: string;
  id?: string;
  title?: string;
  excerpt?: string;
  coverImage?: string;
  slug?: string;
  category?: string;
  createdAt?: string;
};

const toPreview = (item: ApiBlog): BlogPreview => ({
  id: item._id ?? item.id ?? item.slug ?? Math.random().toString(16).slice(2),
  title: item.title ?? "Untitled",
  description:
    item.excerpt ?? "Read the latest plant care insights and ideas.",
  image: item.coverImage ?? "/frontend/BlogPage/Box1.jpg",
  slug: item.slug,
});

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
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

export default function BlogSection() {
  const [blogs, setBlogs] = useState<BlogPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/blogs/published?limit=4");
        const incoming = (response.data?.data?.blogs ??
          response.data?.data ??
          []) as ApiBlog[];

        if (!incoming.length) throw new Error("No blogs available");

        setBlogs(incoming.slice(0, 4).map(toPreview));
      } catch {
        setBlogs(
          blogPosts.slice(0, 4).map((item) => ({
            id: item.slug,
            title: item.title,
            description: item.description,
            image: item.image,
            slug: item.slug,
          })),
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const featured = blogs[0];
  const rest = blogs.slice(1, 4);

  return (
    <section className="px-4 py-16 md:px-6" id="blog-preview">
      <div className="mx-auto w-full max-w-[1320px]">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Blog & Guides
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
              Plant Care Insights
            </h2>
            <div className="hp-section-divider" />
          </div>
          <Link
            href="/blog"
            className="group mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700 md:mt-0"
          >
            View all posts
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </motion.div>

        {/* ── Loading Skeleton ── */}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <div className="pw-shimmer h-64" />
              <div className="p-5">
                <div className="h-5 w-4/5 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-3/5 rounded bg-slate-100" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={`blog-skel-${i}`}
                  className="flex gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3"
                >
                  <div className="pw-shimmer h-24 w-28 flex-shrink-0 rounded-xl" />
                  <div className="flex-1 py-1">
                    <div className="h-4 w-3/4 rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-full rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid gap-5 md:grid-cols-2"
          >
            {/* ── Featured post (large) ── */}
            {featured && (
              <motion.article
                variants={cardVariants}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                <div className="relative h-64 overflow-hidden md:h-72">
                  <Image
                    src={featured.image}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Category tag */}
                  <div className="absolute left-4 top-4 rounded-lg bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                    Plant Care
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} />
                      May 2026
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen size={12} />
                      5 min read
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-slate-900 transition group-hover:text-emerald-700">
                    {featured.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
                    {featured.description}
                  </p>
                  <Link
                    href={featured.slug ? `/blog/${featured.slug}` : "/blog"}
                    className="group/link mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                  >
                    Read article
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover/link:translate-x-1"
                    />
                  </Link>
                </div>
              </motion.article>
            )}

            {/* ── Side posts (compact) ── */}
            <div className="flex flex-col gap-4">
              {rest.map((post) => (
                <motion.article
                  key={post.id}
                  variants={cardVariants}
                  className="group flex gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-lg"
                >
                  <div className="relative h-28 w-32 flex-shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="128px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-center py-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Calendar size={11} />
                      <span>May 2026</span>
                    </div>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 transition group-hover:text-emerald-700">
                      {post.title}
                    </h3>
                    <Link
                      href={post.slug ? `/blog/${post.slug}` : "/blog"}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
                    >
                      Read more
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
