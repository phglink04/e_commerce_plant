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
          err instanceof Error ? err.message : "Failed to delete product",
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
        placeholder="Search products…"
        debounceDelay={500}
      />

      {/* Products Table */}
      {!loading && products.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-sm font-semibold text-slate-700">
                <th className="px-6 py-3 text-left">Product Name</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-right">Giá nhập</th>
                <th className="px-6 py-3 text-right">Giá bán</th>
                <th className="px-6 py-3 text-center">Discount</th>
                <th className="px-6 py-3 text-left">Stock</th>
                <th className="px-6 py-3 text-center">Featured</th>
                <th className="px-6 py-3 text-center">Flash Sale</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => (
                <tr key={product._id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm font-medium text-slate-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">
                    {product.category}
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-slate-500">
                    {(product.costPrice ?? 0).toLocaleString()} ₫
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-emerald-600">
                    {product.price.toLocaleString()} ₫
                    {(product.discountPercentage ?? 0) > 0 && (
                      <div className="text-xs font-normal text-rose-500">
                        → {(product.salePrice ?? product.price).toLocaleString()} ₫
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {(product.discountPercentage ?? 0) > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">
                        -{product.discountPercentage}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">
                    {product.stock} units
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
                        product.isFeatured ? "bg-amber-500" : "bg-slate-300"
                      }`}
                    >
                      {product.isFeatured ? "✓" : "−"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
                        product.isFlashSale ? "bg-orange-500" : "bg-slate-300"
                      }`}
                    >
                      {product.isFlashSale ? "✓" : "−"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
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
          title="Delete Product"
          description={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
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
