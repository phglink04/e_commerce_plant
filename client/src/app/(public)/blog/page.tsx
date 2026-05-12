"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { blogPosts } from "@/lib/mock-content";

type BlogItem = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: string;
  createdAt?: string;
};

export default function BlogPage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/api/blogs/published?page=${page}&limit=12`,
        );
        const data = response.data;
        const items = (data?.data?.blogs ?? []) as BlogItem[];

        if (items.length > 0) {
          setBlogs(items);
          setTotalPages(data?.totalPages ?? 1);
        } else {
          // Fallback to mock data if no published blogs
          setBlogs(
            blogPosts.map((post, idx) => ({
              _id: `mock-${idx}`,
              title: post.title,
              slug: post.slug,
              excerpt: post.description,
              coverImage: post.image,
              category: "General",
              author: "",
            })),
          );
          setTotalPages(1);
        }
      } catch {
        // Fallback to mock data on error
        setBlogs(
          blogPosts.map((post, idx) => ({
            _id: `mock-${idx}`,
            title: post.title,
            slug: post.slug,
            excerpt: post.description,
            coverImage: post.image,
            category: "General",
            author: "",
          })),
        );
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    void fetchBlogs();
  }, [page]);

  return (
    <main>
      <header className="pw-blog-header">
        <div
          className="pw-blog-header-bg"
          style={{
            backgroundImage: 'url("/frontend/BlogPage/BlogHeader.jpg")',
          }}
        />
        <div className="pw-blog-header-overlay" />
        <div className="container pw-blog-header-content">
          <h1>About PlantWorld</h1>
          <p>
            PlantWorld is where the love for gardening blooms. We share ideas,
            tips, and stories to help you grow with confidence.
          </p>
        </div>
      </header>

      <section className="container pw-blog-grid-wrap">
        {loading ? (
          <div className="pw-blog-grid">
            {[1, 2, 3, 4].map((i) => (
              <article key={`skel-${i}`} className="pw-blog-card">
                <div
                  className="pw-shimmer"
                  style={{ height: 280, borderRadius: 12 }}
                />
                <h3
                  style={{
                    height: 20,
                    width: "70%",
                    background: "#f1f5f9",
                    borderRadius: 8,
                    marginTop: 12,
                  }}
                />
                <p
                  style={{
                    height: 14,
                    width: "90%",
                    background: "#f1f5f9",
                    borderRadius: 6,
                    marginTop: 8,
                  }}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="pw-blog-grid">
            {blogs.map((post) => (
              <article key={post._id} className="pw-blog-card">
                <Image
                  src={post.coverImage || "/frontend/BlogPage/Box1.jpg"}
                  alt={post.title}
                  width={420}
                  height={280}
                />
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`} className="pw-btn ghost">
                  Read More
                </Link>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 32,
            }}
          >
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="pw-btn ghost"
              style={{ opacity: page <= 1 ? 0.4 : 1 }}
            >
              ← Previous
            </button>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 14,
                color: "#64748b",
              }}
            >
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="pw-btn ghost"
              style={{ opacity: page >= totalPages ? 0.4 : 1 }}
            >
              Next →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
