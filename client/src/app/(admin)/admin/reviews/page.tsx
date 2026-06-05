"use client";

import { useEffect, useState, useCallback } from "react";
import { adminReviewService } from "@/services/admin/review.service";
import type { Review } from "@/types/review";
import ConfirmDialog from "@/components/admin/ui/confirm-dialog";
import { Star, MessageSquare, Trash2, Search, MessageCircle } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  // Reply modal
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Delete target
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminReviewService.getReviews({
        page,
        limit: 15,
        search: search || undefined,
        rating: ratingFilter ? Number(ratingFilter) : undefined,
      });
      setReviews(res.items);
      setTotalPages(res.totalPages);
      setTotalResults(res.totalResults);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setActionLoading(deleteTargetId);
    try {
      await adminReviewService.deleteReview(deleteTargetId);
      setReviews((prev) => prev.filter((r) => r.id !== deleteTargetId));
      setTotalResults((prev) => prev - 1);
      setDeleteTargetId(null);
    } catch {} finally { setActionLoading(null); }
  };

  const handleReply = async () => {
    if (!replyTarget) return;
    setActionLoading(replyTarget);
    try {
      const updated = await adminReviewService.replyAsAdmin(replyTarget, replyText.trim());
      setReviews((prev) => prev.map((r) => (r.id === replyTarget ? updated : r)));
      setReplyTarget(null);
      setReplyText("");
    } catch {} finally { setActionLoading(null); }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <MessageSquare className="mr-2 text-emerald-600" size={24} />
            Quản lý Đánh giá
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Tổng cộng {totalResults.toLocaleString()} đánh giá
          </p>
        </div>
      </header>

      {/* Filters Form */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            placeholder="Tìm theo tên người dùng, nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Số sao:</label>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} ★</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
          Tìm kiếm
        </button>
      </form>

      {/* Table Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-slate-100 bg-white">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 mx-auto"></div>
            <p className="mt-2 text-sm text-slate-500">Đang tải đánh giá...</p>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-6 text-center">
          <MessageCircle size={36} className="text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-900">Không tìm thấy đánh giá nào</p>
          <p className="text-xs text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-sm font-semibold text-slate-700">
                <th className="px-6 py-3 text-left whitespace-nowrap">Người dùng</th>
                <th className="px-6 py-3 text-left whitespace-nowrap">Đánh giá</th>
                <th className="px-6 py-3 text-left whitespace-nowrap">Nội dung</th>
                <th className="px-6 py-3 text-center whitespace-nowrap">Hình ảnh</th>
                <th className="px-6 py-3 text-center whitespace-nowrap">Ngày đăng</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reviews.map((review) => {
                const adminReplies = review.replies?.filter(r => r.isAdmin) || [];
                return (
                  <tr key={review.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
                          {review.userName?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{review.userName}</p>
                          {review.product && (
                            <p className="text-xs text-slate-400 mt-0.5 max-w-[180px] truncate" title={review.product.name}>
                              Cây: {review.product.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < review.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[320px]">
                        <p className="text-sm text-slate-700 whitespace-normal break-words line-clamp-2" title={review.content}>
                          {review.content || <em className="text-slate-400">Không có nội dung</em>}
                        </p>
                        {adminReplies.length > 0 && (
                          <div className="mt-1.5 rounded-lg bg-slate-50 p-2 text-xs border border-slate-100">
                            <p className="font-semibold text-emerald-700">Phản hồi của Admin:</p>
                            {adminReplies.map((rep, idx) => (
                              <p key={idx} className="text-slate-500 mt-0.5">{rep.content}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {review.images && review.images.length > 0 ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {review.images.slice(0, 3).map((img, idx) => (
                            <div key={idx} className="relative h-8 w-12 flex-shrink-0 overflow-hidden rounded-md border border-slate-200">
                              <img src={img} alt="Review" className="h-full w-full object-cover" />
                            </div>
                          ))}
                          {review.images.length > 3 && (
                            <span className="text-xs font-semibold text-slate-500">+{review.images.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-slate-500">
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setReplyTarget(review.id);
                            const existing = review.replies?.find(r => r.isAdmin)?.content || "";
                            setReplyText(existing);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                          title="Trả lời"
                        >
                          <MessageSquare size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(review.id)}
                          disabled={actionLoading === review.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Tiếp
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Hiển thị trang <span className="font-semibold">{page}</span> trong tổng số <span className="font-semibold">{totalPages}</span> trang
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-40"
                >
                  ← Trước
                </button>
                {[...Array(totalPages)].map((_, idx) => {
                  const p = idx + 1;
                  const isActive = p === page;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                        isActive
                          ? "z-10 bg-emerald-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                          : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-offset-0"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-40"
                >
                  Tiếp →
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setReplyTarget(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Trả lời đánh giá</h3>
            <textarea
              className="w-full h-32 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Viết câu trả lời của bạn..."
              maxLength={2000}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                onClick={() => setReplyTarget(null)}
              >
                Hủy
              </button>
              <button
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                onClick={handleReply}
                disabled={actionLoading === replyTarget}
              >
                {actionLoading === replyTarget ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        title="Xóa đánh giá"
        description="Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        open={!!deleteTargetId}
        loading={actionLoading === deleteTargetId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        variant="danger"
      />
    </div>
  );
}
