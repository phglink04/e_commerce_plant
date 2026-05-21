"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Eye, FileText } from "lucide-react";
import { SearchBar, Pagination } from "@/components/ui";
import AdminModal from "@/components/admin/ui/admin-modal";
import AdminToast from "@/components/admin/ui/admin-toast";
import ConfirmDialog from "@/components/admin/ui/confirm-dialog";
import AdminBlogForm from "@/components/admin/AdminBlogForm";
import { blogService } from "@/services/admin/blog.service";
import { Blog } from "@/types/blog";

const statusColors: Record<string, string> = {
  published:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft:
    "bg-amber-50 text-amber-700 border-amber-200",
  archived:
    "bg-slate-100 text-slate-600 border-slate-200",
};

const statusLabels: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  archived: "Archived",
};

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    totalResults: number;
    totalPages: number;
    page: number;
  } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch blogs
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await blogService.getBlogs({
        page,
        limit: 12,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setBlogs(result.items);
      setPagination({
        totalResults: result.totalResults,
        totalPages: result.totalPages,
        page: result.page,
      });
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
      setToast({
        type: "error",
        message: "Failed to load blogs",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Open create form
  const handleCreate = () => {
    setEditingBlog(null);
    setShowForm(true);
  };

  // Open edit form
  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setShowForm(true);
  };

  // Close forms
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBlog(null);
  };

  // Delete blog
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await blogService.deleteBlog(deleteTarget._id);
      setToast({ type: "success", message: "Blog deleted successfully" });
      setDeleteTarget(null);
      fetchBlogs();
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to delete blog",
      });
    } finally {
      setDeleting(false);
    }
  };

  // After form success
  const handleFormSuccess = () => {
    setToast({
      type: "success",
      message: editingBlog
        ? "Blog updated successfully"
        : "Blog created successfully",
    });
    fetchBlogs();
  };

  const goToPage = (p: number) => setPage(p);

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            <FileText className="mr-2 inline-block" size={24} />
            Blog Posts
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {pagination?.totalResults?.toLocaleString() || 0} total blog posts
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-700 hover:to-emerald-600"
        >
          <Plus size={16} />
          Add Blog Post
        </button>
      </header>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <SearchBar
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Tìm kiếm bài viết…"
            debounceDelay={500}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Blogs Table */}
      {!loading && blogs.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-sm font-semibold text-slate-700">
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Author</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Featured</th>
                <th className="px-6 py-3 text-center">
                  <Eye size={14} className="mx-auto" />
                </th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {blogs.map((blog) => (
                <tr key={blog._id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {blog.coverImage && (
                        <div className="relative h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                          <img
                            src={blog.coverImage}
                            alt={blog.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {blog.title}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {blog.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">
                    {blog.category}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">
                    {blog.author || "—"}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        statusColors[blog.status] || statusColors.draft
                      }`}
                    >
                      {statusLabels[blog.status] || blog.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
                        blog.isFeatured ? "bg-amber-500" : "bg-slate-300"
                      }`}
                    >
                      {blog.isFeatured ? "✓" : "−"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center text-sm text-slate-500">
                    {(blog.viewCount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(blog)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(blog)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            <p className="text-slate-400">Loading blogs...</p>
          </div>
        </div>
      ) : (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <FileText size={32} className="mb-2 text-slate-300" />
          <p className="text-slate-400">No blog posts found</p>
          <button
            onClick={handleCreate}
            className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Create your first blog post →
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={goToPage}
          isLoading={loading}
        />
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <AdminModal
          title={editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
          open={true}
          onClose={handleCloseForm}
        >
          <AdminBlogForm
            blog={editingBlog}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        </AdminModal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Xóa bài viết"
          description={`Bạn có chắc chắn muốn xóa "${deleteTarget.title}"? Hành động này không thể được hoàn tác.`}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          open={!!deleteTarget}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          variant="danger"
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <AdminToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
