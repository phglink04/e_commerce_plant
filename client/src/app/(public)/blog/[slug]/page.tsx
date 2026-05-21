"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";

type BlogDetail = {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: string;
  tags: string[];
  createdAt?: string;
  viewCount?: number;
};

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/blogs/slug/${slug}`);
        const blog = response.data?.data?.blog as BlogDetail | undefined;

        if (!blog) {
          setError("Bài viết không tồn tại.");
          return;
        }

        setPost(blog);
      } catch {
        setError("Blog post not found.");
      } finally {
        setLoading(false);
      }
    };

    void fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <main className="container pw-blog-detail">
        <div
          style={{
            height: 400,
            borderRadius: 16,
            background: "#f1f5f9",
            marginBottom: 24,
          }}
        />
        <div
          style={{
            height: 32,
            width: "60%",
            background: "#f1f5f9",
            borderRadius: 8,
          }}
        />
        <div
          style={{
            height: 16,
            width: "80%",
            background: "#f1f5f9",
            borderRadius: 6,
            marginTop: 12,
          }}
        />
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="container pw-blog-detail" style={{ textAlign: "center", paddingTop: 80 }}>
        <h1>Post Not Found</h1>
        <p style={{ color: "#64748b", marginTop: 8 }}>{error || "The blog post you're looking for doesn't exist."}</p>
        <Link href="/blog" className="pw-btn ghost" style={{ marginTop: 24, display: "inline-block" }}>
          ← Back to Blog
        </Link>
      </main>
    );
  }

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="container pw-blog-detail">
      <Image
        src={post.coverImage || "/frontend/BlogPage/Box1.jpg"}
        alt={post.title}
        className="pw-blog-detail-cover"
        width={1200}
        height={720}
      />

      {/* Meta info */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
        {post.category && <span>📂 {post.category}</span>}
        {post.author && <span>✍️ {post.author}</span>}
        {formattedDate && <span>📅 {formattedDate}</span>}
        {typeof post.viewCount === "number" && <span>👁️ {post.viewCount} views</span>}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: "#ecfdf5",
                color: "#059669",
                padding: "2px 10px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <h1>{post.title}</h1>

      {post.excerpt && (
        <p className="pw-blog-detail-description">{post.excerpt}</p>
      )}

      <div
        className="pw-blog-detail-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div style={{ marginTop: 40 }}>
        <Link href="/blog" className="pw-btn ghost">
          ← Back to Blog
        </Link>
      </div>
    </main>
  );
}
