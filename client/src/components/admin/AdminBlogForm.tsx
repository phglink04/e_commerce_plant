"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import FormInput from "@/components/admin/ui/form-input";
import ToggleSwitch from "@/components/admin/ui/toggle-switch";
import RichTextEditor from "@/components/admin/ui/RichTextEditor";
import { Blog, CreateBlogPayload } from "@/types/blog";
import { blogService } from "@/services/admin/blog.service";

interface AdminBlogFormProps {
  blog?: Blog | null;
  onClose: () => void;
  onSuccess: () => void;
}

const initialForm = {
  title: "",
  content: "",
  excerpt: "",
  coverImage: "",
  category: "General",
  tags: "",
  status: "draft" as "draft" | "published" | "archived",
  author: "",
  isFeatured: false,
};

export default function AdminBlogForm({
  blog,
  onClose,
  onSuccess,
}: AdminBlogFormProps) {
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing blog data into form
  useEffect(() => {
    if (blog) {
      setForm({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt ?? "",
        coverImage: blog.coverImage || "",
        category: blog.category ?? "General",
        tags: (blog.tags ?? []).join(", "),
        status: blog.status ?? "draft",
        author: blog.author ?? "",
        isFeatured: blog.isFeatured ?? false,
      });
    }
  }, [blog]);

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) return "";
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const safeCoverImage = (form.coverImage || "").trim();
    if (!blog && !imageFile) {
      setError("Vui lòng tải lên ảnh bìa cho bài viết.");
      return;
    }

    if (!form.title.trim()) {
      setError("Tiêu đề không được để trống.");
      return;
    }
    if (!form.content.trim()) {
      setError("Nội dung bài viết không được để trống.");
      return;
    }

    try {
      setSubmitting(true);

      const payload: CreateBlogPayload = {
        title: form.title,
        content: form.content,
        excerpt: form.excerpt,
        coverImage: safeCoverImage || undefined,
        category: form.category,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: form.status,
        author: form.author,
        isFeatured: form.isFeatured,
        imageFile: imageFile,
      };

      if (blog?._id) {
        await blogService.updateBlog(blog._id, payload);
      } else {
        await blogService.createBlog(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lưu bài viết thất bại",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id="blog-form" onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* ── Section 1: Ảnh bìa ── */}
      <div>
        <label
          className="text-sm font-semibold text-slate-700"
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}
        >
          📷 Ảnh bìa bài viết
        </label>
        <label
          style={{
            display: "block",
            position: "relative",
            width: "100%",
            height: 180,
            borderRadius: 12,
            border: "2px dashed #cbd5e1",
            background: "#f8fafc",
            overflow: "hidden",
            cursor: "pointer",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#10b981")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setImageFile(file);
            }}
            style={{ display: "none" }}
          />

          {imagePreviewUrl || form.coverImage ? (
            <>
              <Image
                src={imagePreviewUrl || form.coverImage}
                alt="Preview"
                fill
                className="object-cover"
              />
              {/* Hover overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.2s",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                <span style={{ fontSize: 28, marginBottom: 4 }}>📷</span>
                Bấm để thay đổi ảnh
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#94a3b8",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 36 }}>📷</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#059669" }}>
                Bấm để chọn ảnh bìa
              </span>
              <span style={{ fontSize: 12 }}>PNG, JPG, WEBP — tối đa 5MB</span>
            </div>
          )}
        </label>
      </div>

      {/* ── Section 2: Thông tin cơ bản ── */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 12,
          padding: 16,
          border: "1px solid #e2e8f0",
        }}
      >
        <label
          className="text-sm font-semibold text-slate-700"
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}
        >
          📝 Thông tin bài viết
        </label>

        {/* Tiêu đề - full width */}
        <FormInput
          id="blog-title"
          label="Tiêu đề bài viết"
          value={form.title}
          onChange={(value) => handleInputChange("title", value)}
          placeholder="Nhập tiêu đề bài viết..."
          required
        />

        {/* Danh mục + Tác giả */}
        <div className="grid gap-4 sm:grid-cols-2" style={{ marginTop: 12 }}>
          <FormInput
            id="blog-category"
            label="Danh mục"
            value={form.category}
            onChange={(value) => handleInputChange("category", value)}
            placeholder="vd: Chăm sóc cây, Mẹo vặt..."
          />
          <FormInput
            id="blog-author"
            label="Tác giả"
            value={form.author}
            onChange={(value) => handleInputChange("author", value)}
            placeholder="Tên tác giả..."
          />
        </div>

        {/* Tags + Status + Featured */}
        <div className="grid gap-4 sm:grid-cols-3" style={{ marginTop: 12 }}>
          <FormInput
            id="blog-tags"
            label="Nhãn (phân cách bằng dấu phẩy)"
            value={form.tags}
            onChange={(value) => handleInputChange("tags", value)}
            placeholder="vd: cây xanh, mẹo hay"
          />

          {/* Status */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Trạng thái
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                handleInputChange(
                  "status",
                  e.target.value as "draft" | "published" | "archived",
                )
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="draft">📝 Bản nháp</option>
              <option value="published">✅ Xuất bản</option>
              <option value="archived">📦 Lưu trữ</option>
            </select>
          </div>

          {/* Featured Toggle */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Hiển thị nổi bật
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 42,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#fff",
              }}
            >
              <ToggleSwitch
                label="Bài viết nổi bật"
                checked={form.isFeatured}
                onChange={(checked) => handleInputChange("isFeatured", checked)}
                color="amber"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Mô tả ngắn ── */}
      <div>
        <label className="text-sm font-semibold text-slate-700" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          📋 Mô tả ngắn
        </label>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 6px" }}>
          Đoạn tóm tắt hiển thị ở trang danh sách blog và kết quả tìm kiếm
        </p>
        <textarea
          value={form.excerpt}
          onChange={(e) => handleInputChange("excerpt", e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          rows={3}
          placeholder="Viết một vài câu mô tả ngắn gọn về bài viết..."
        />
      </div>

      {/* ── Section 4: Nội dung (Rich Text Editor) ── */}
      <div>
        <label className="text-sm font-semibold text-slate-700" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          ✍️ Nội dung bài viết
        </label>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 8px" }}>
          Gõ nội dung bên dưới, bôi đen chữ để in đậm, in nghiêng, hoặc chọn kiểu tiêu đề từ thanh công cụ
        </p>
        <RichTextEditor
          value={form.content}
          onChange={(html) => handleInputChange("content", html)}
          placeholder="Bắt đầu viết nội dung bài viết tại đây..."
          minHeight={300}
        />
      </div>

      {/* ── Footer Actions ── */}
      <div className="flex gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50"
        >
          {submitting ? "Đang lưu…" : blog ? "Cập nhật bài viết" : "Tạo bài viết"}
        </button>
      </div>
    </form>
  );
}
