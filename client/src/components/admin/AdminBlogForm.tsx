"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import FormInput from "@/components/admin/ui/form-input";
import ToggleSwitch from "@/components/admin/ui/toggle-switch";
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
    if (!blog && !imageFile && !safeCoverImage) {
      setError("Please upload an image or provide an image URL.");
      return;
    }

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.content.trim()) {
      setError("Content is required.");
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
        err instanceof Error ? err.message : "Failed to save blog post",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id="blog-form" onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Cover Image Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">
          Cover Image
        </label>
        <div className="flex gap-4">
          {/* Image Preview */}
          <div className="relative h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
            {imagePreviewUrl || form.coverImage ? (
              <Image
                src={imagePreviewUrl || form.coverImage}
                alt="Preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No image
              </div>
            )}
          </div>

          {/* Upload Area */}
          <div className="flex-1">
            <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setImageFile(file);
                  }}
                  className="hidden"
                />
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-emerald-600">Click</span> to
                  upload image
                </div>
                <p className="text-xs text-slate-500">or provide URL below</p>
              </label>
            </div>
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) => handleInputChange("coverImage", e.target.value)}
              placeholder="Or paste image URL"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Title & Category */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          id="blog-title"
          label="Tiêu đề"
          value={form.title}
          onChange={(value) => handleInputChange("title", value)}
          required
        />
        <FormInput
          id="blog-category"
          label="Danh mục"
          value={form.category}
          onChange={(value) => handleInputChange("category", value)}
        />
      </div>

      {/* Author & Tags */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          id="blog-author"
          label="Tác giả"
          value={form.author}
          onChange={(value) => handleInputChange("author", value)}
        />
        <FormInput
          id="blog-tags"
          label="Nhãn (ðởia chỉ ngăn cách bằng dấu phảy)"
          value={form.tags}
          onChange={(value) => handleInputChange("tags", value)}
          placeholder="vd: cây xanh, mẫo dùm, chăm sóc"
        />
      </div>

      {/* Status */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">
          Status
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
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Excerpt */}
      <div>
        <label className="text-sm font-medium text-slate-700">
          Excerpt (Short description)
        </label>
        <textarea
          value={form.excerpt}
          onChange={(e) => handleInputChange("excerpt", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          rows={3}
          placeholder="Một tóm tắt ngắn của bài viết..."
        />
      </div>

      {/* Content */}
      <div>
        <label className="text-sm font-medium text-slate-700">Content</label>
        <textarea
          value={form.content}
          onChange={(e) => handleInputChange("content", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
          rows={10}
          placeholder="Viết nội dung bài viết tại đây... (hỗ trợ HTML)"
          required
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <ToggleSwitch
          label="Bài viết nổi bật"
          checked={form.isFeatured}
          onChange={(checked) => handleInputChange("isFeatured", checked)}
          color="amber"
        />
      </div>

      {/* Footer Actions */}
      <div className="flex gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50"
        >
          {submitting ? "Saving…" : blog ? "Save Changes" : "Create Blog"}
        </button>
      </div>
    </form>
  );
}
