"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useProducts } from "@/hooks";
import { SearchBar, Pagination } from "@/components/ui";
import AdminModal from "@/components/admin/ui/admin-modal";
import AdminToast from "@/components/admin/ui/admin-toast";
import ConfirmDialog from "@/components/admin/ui/confirm-dialog";
import AdminProductForm from "@/components/admin/AdminProductForm";
import { productService } from "@/services";
import { Product } from "@/types/product";

export default function AdminPlantsPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch products with search
  const { products, loading, pagination, goToPage, refetch } = useProducts({
    search,
    limit: 12,
  });

  // Open create form
  const handleCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  // Open edit form
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  // Close forms
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  // Delete product
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await productService.deleteProduct(deleteTarget._id);
      setToast({ type: "success", message: "Product deleted successfully" });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof Error ? err.message : "Đã xáy ra lỗi khi xóa sản phẩm",
      });
    } finally {
      setDeleting(false);
    }
  };

  // After form success
  const handleFormSuccess = () => {
    setToast({
      type: "success",
      message: editingProduct
        ? "Product updated successfully"
        : "Product created successfully",
    });
    refetch();
  };

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Products
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {pagination?.totalResults?.toLocaleString() || 0} total products
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-700 hover:to-emerald-600"
        >
          <Plus size={16} />
          Add Product
        </button>
      </header>

      {/* Search Bar */}
      <SearchBar
        onSearch={setSearch}
        placeholder="Tìm kiếm sản phẩm…"
        debounceDelay={500}
      />

      {/* Products Table */}
      {!loading && products.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 text-left">Sản phẩm</th>
                <th className="px-4 py-3 text-left">Danh mục</th>
                <th className="px-4 py-3 text-right">Giá nhập</th>
                <th className="px-4 py-3 text-right">Giá bán</th>
                <th className="px-4 py-3 text-center">Giảm giá</th>
                <th className="px-4 py-3 text-center">Kho</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Nổi bật</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product._id} className="transition hover:bg-slate-50/80">
                  {/* Product name with image */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        {product.imageCover ? (
                          <img
                            src={product.imageCover}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300 text-xs">N/A</div>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-slate-800 line-clamp-1">{product.name}</span>
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {product.category}
                    </span>
                  </td>
                  {/* Cost Price */}
                  <td className="px-4 py-3 text-right text-sm text-slate-500 tabular-nums">
                    {(product.costPrice ?? 0).toLocaleString("vi-VN")}₫
                  </td>
                  {/* Sell Price */}
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm font-semibold text-emerald-600 tabular-nums">
                      {product.price.toLocaleString("vi-VN")}₫
                    </div>
                    {(product.discountPercentage ?? 0) > 0 && (
                      <div className="text-xs text-rose-500 tabular-nums">
                        → {(product.salePrice ?? product.price).toLocaleString("vi-VN")}₫
                      </div>
                    )}
                  </td>
                  {/* Discount */}
                  <td className="px-4 py-3 text-center">
                    {(product.discountPercentage ?? 0) > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600 ring-1 ring-rose-200">
                        -{product.discountPercentage}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  {/* Stock */}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-semibold tabular-nums ${
                      (product.stock ?? 0) === 0 ? "text-red-500" : (product.stock ?? 0) <= 5 ? "text-amber-600" : "text-slate-700"
                    }`}>
                      {product.stock ?? 0}
                    </span>
                  </td>
                  {/* Availability */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      product.availability === "In Stock"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : product.availability === "Out Of Stock"
                        ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                        : "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        product.availability === "In Stock"
                          ? "bg-emerald-500"
                          : product.availability === "Out Of Stock"
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`} />
                      {product.availability === "In Stock" ? "Còn hàng" : product.availability === "Out Of Stock" ? "Hết hàng" : "Sắp về"}
                    </span>
                  </td>
                  {/* Featured & Flash Sale */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {product.isFeatured && (
                        <span className="inline-flex h-6 items-center gap-1 rounded-full bg-amber-50 px-2 text-xs font-semibold text-amber-600 ring-1 ring-amber-200" title="Nổi bật">
                          ⭐
                        </span>
                      )}
                      {product.isFlashSale && (
                        <span className="inline-flex h-6 items-center gap-1 rounded-full bg-orange-50 px-2 text-xs font-semibold text-orange-600 ring-1 ring-orange-200" title="Flash Sale">
                          🔥
                        </span>
                      )}
                      {!product.isFeatured && !product.isFlashSale && (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(product)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
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
          <p className="text-slate-400">Loading products...</p>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <p className="text-slate-400">No products found</p>
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
          title={editingProduct ? "Edit Product" : "Create New Product"}
          open={true}
          onClose={handleCloseForm}
        >
          <AdminProductForm
            product={editingProduct}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        </AdminModal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Xóa sản phẩm"
          description={`Bạn có chắc chắn muốn xóa "${deleteTarget.name}"? Hành động này không thể được hoàn tác.`}
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
