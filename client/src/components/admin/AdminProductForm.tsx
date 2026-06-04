"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  ImageIcon,
  Upload,
  Loader2,
  X,
  Plus,
  Tag,
  DollarSign,
  Package,
  Sparkles,
  Flame,
  Check,
  ChevronDown,
} from "lucide-react";
import ToggleSwitch from "@/components/admin/ui/toggle-switch";
import { Product } from "@/types/product";
import { productService } from "@/services";
import api from "@/lib/api";

/* ─────────────────────────────────────────────────────── */
/*  Types                                                  */
/* ─────────────────────────────────────────────────────── */

interface AdminProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

type ApiCategory = { _id: string; name: string; slug?: string };

const initialForm = {
  name: "",
  category: "",
  price: 0,
  costPrice: 0,
  imageCover: "",
  availability: "In Stock" as "In Stock" | "Out Of Stock" | "Discontinued",
  tag: "" as string,
  tags: [] as string[],
  description: "",
  stock: 0,
  isFeatured: false,
  isFlashSale: false,
  discountPercentage: 0,
};

/* ─────────────────────────────────────────────────────── */
/*  Helpers                                                */
/* ─────────────────────────────────────────────────────── */

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

/* ─────────────────────────────────────────────────────── */
/*  Main Component                                         */
/* ─────────────────────────────────────────────────────── */

export default function AdminProductForm({
  product,
  onClose,
  onSuccess,
}: AdminProductFormProps) {
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category & Tag state
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>(["indoor", "outdoor", "easy-care", "office", "desktop"]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const [newTagInput, setNewTagInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  // ── Fetch categories ──
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/api/categories?limit=100");
        const cats = (res.data?.data?.categories ?? []) as ApiCategory[];
        setCategories(cats.map((c) => c.name));
      } catch {
        setCategories(["Indoor Plants", "Outdoor Plants", "Succulents"]);
      }
    };
    void fetchCategories();
  }, []);

  // ── Fetch unique tags from products ──
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await api.get("/api/plants?limit=200");
        const plants = (res.data?.data?.plants ?? []) as { tags?: string[] }[];
        const unique = new Set<string>(["indoor", "outdoor", "easy-care", "office", "desktop"]);
        plants.forEach((p) => {
          if (p.tags) p.tags.forEach((t) => unique.add(t));
        });
        setTags(Array.from(unique));
      } catch {
        /* keep defaults */
      }
    };
    void fetchTags();
  }, []);

  // ── Load existing product ──
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        category: product.category,
        price: product.price,
        costPrice: product.costPrice ?? 0,
        imageCover: product.imageCover || "",
        availability:
          (product.availability as "In Stock" | "Out Of Stock" | "Discontinued") ||
          "In Stock",
        tag: product.tag || "",
        tags: product.tags ?? [],
        description: product.description ?? "",
        stock: product.stock ?? 0,
        isFeatured: product.isFeatured ?? false,
        isFlashSale: product.isFlashSale ?? false,
        discountPercentage: product.discountPercentage ?? 0,
      });
    }
  }, [product]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Image preview ──
  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) return "";
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const previewSrc = imagePreviewUrl || form.imageCover;

  // ── Computed sale price ──
  const salePrice = useMemo(() => {
    if (!form.price || form.discountPercentage <= 0) return form.price;
    return form.price * (1 - form.discountPercentage / 100);
  }, [form.price, form.discountPercentage]);

  // ── Handlers ──
  const updateField = useCallback(
    (field: string, value: string | number | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Vui lòng chọn file ảnh (jpg, png, webp...)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File ảnh quá lớn. Tối đa 10MB.");
        return;
      }
      setImageFile(file);
      setError(null);
    }
  };

  const handleAddCategory = () => {
    const v = newCatInput.trim();
    if (v && !categories.includes(v)) {
      setCategories((prev) => [...prev, v]);
    }
    if (v) updateField("category", v);
    setNewCatInput("");
    setCatDropdownOpen(false);
  };

  const handleAddTag = () => {
    const v = newTagInput.trim();
    if (v && !tags.includes(v)) {
      setTags((prev) => [...prev, v]);
    }
    if (v) {
      setForm((prev) => {
        const newTags = prev.tags.includes(v) ? prev.tags : [...prev.tags, v];
        return { ...prev, tags: newTags };
      });
    }
    setNewTagInput("");
    setTagDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!product && !imageFile && !form.imageCover.trim()) {
      setError("Vui lòng chọn ảnh sản phẩm.");
      return;
    }
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }
    if (!form.category.trim()) {
      setError("Vui lòng chọn danh mục.");
      return;
    }
    if (form.price <= 0) {
      setError("Giá bán phải lớn hơn 0.");
      return;
    }
    if (form.costPrice < 0) {
      setError("Giá nhập không được âm.");
      return;
    }
    if (form.stock < 0) {
      setError("Số lượng tồn kho không được âm.");
      return;
    }
    if (form.discountPercentage < 0 || form.discountPercentage > 100) {
      setError("Mã giảm giá phải từ 0 đến 100.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        imageCover: form.imageCover.trim(),
        imageFile,
      };

      if (product?._id) {
        await productService.updateProduct(product._id, payload);
      } else {
        await productService.createProduct(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi lưu sản phẩm");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id="product-form" onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <X size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          SECTION 1: Product Image
          ═══════════════════════════════════════════════════ */}
      <div>
        <SectionLabel icon={<ImageIcon size={14} />} text="Hình ảnh sản phẩm" />

        {previewSrc ? (
          <div className="relative group mt-2 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
            <Image
              src={previewSrc}
              alt="Product preview"
              width={600}
              height={300}
              className="w-full h-48 object-contain bg-white"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg hover:bg-slate-50"
              >
                <Upload size={14} />
                Đổi ảnh
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  updateField("imageCover", "");
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-red-600"
              >
                <X size={14} />
                Xóa
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 w-full flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-slate-400 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
              <ImageIcon size={20} />
            </div>
            <span className="text-sm font-medium">
              Click để chọn ảnh sản phẩm
            </span>
            <span className="text-xs">JPG, PNG, WebP — tối đa 10MB</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 2: Product Name
          ═══════════════════════════════════════════════════ */}
      <div>
        <SectionLabel icon={<Package size={14} />} text="Tên sản phẩm" />
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Nhập tên sản phẩm..."
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 3: Category + Tag
          ═══════════════════════════════════════════════════ */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Category Dropdown + Create */}
        <div ref={catRef}>
          <SectionLabel icon={<Tag size={14} />} text="Danh mục (Category)" />
          <div className="relative mt-1">
            <button
              type="button"
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 bg-white transition hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <span className={form.category ? "text-slate-800" : "text-slate-400"}>
                {form.category || "Chọn danh mục..."}
              </span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${catDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {catDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      updateField("category", cat);
                      setCatDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 flex items-center justify-between ${form.category === cat ? "bg-emerald-50 text-emerald-700 font-medium" : "text-slate-700"}`}
                  >
                    {cat}
                    {form.category === cat && <Check size={14} className="text-emerald-600" />}
                  </button>
                ))}
                {/* Create new */}
                <div className="border-t border-slate-100 p-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                      placeholder="Tạo danh mục mới..."
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-white hover:bg-emerald-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tag Dropdown + Create */}
        <div ref={tagRef}>
          <SectionLabel icon={<Tag size={14} />} text="Tag" />
          <div className="relative mt-1">
            <button
              type="button"
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 bg-white transition hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <span className={form.tags.length > 0 ? "text-slate-800" : "text-slate-400"}>
                {form.tags.length > 0 ? form.tags.join(", ") : "Chọn tag..."}
              </span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${tagDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {tagDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setForm((prev) => {
                        const newTags = prev.tags.includes(t)
                          ? prev.tags.filter((x) => x !== t)
                          : [...prev.tags, t];
                        return { ...prev, tags: newTags };
                      });
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 flex items-center justify-between ${form.tags.includes(t) ? "bg-emerald-50 text-emerald-700 font-medium" : "text-slate-700"}`}
                  >
                    {t}
                    {form.tags.includes(t) && <Check size={14} className="text-emerald-600" />}
                  </button>
                ))}
                {/* Create new */}
                <div className="border-t border-slate-100 p-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                      placeholder="Tạo tag mới..."
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-white hover:bg-emerald-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 4: Pricing
          ═══════════════════════════════════════════════════ */}
      <div>
        <SectionLabel icon={<DollarSign size={14} />} text="Giá & Giảm giá" />
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {/* Cost Price */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Giá nhập (đ)</label>
            <input
              type="number"
              min={0}
              value={form.costPrice || ""}
              onChange={(e) => updateField("costPrice", parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Giá bán (đ) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={form.price || ""}
              onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
              placeholder="0"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Discount */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">% Giảm giá</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.discountPercentage || ""}
              onChange={(e) => updateField("discountPercentage", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {/* Auto-calculated Sale Price */}
        {form.discountPercentage > 0 && form.price > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
            <Sparkles size={14} className="text-emerald-600" />
            <span className="text-sm text-emerald-700">
              Giá sau giảm:{" "}
              <span className="font-bold">{formatVND(salePrice)}đ</span>
              <span className="ml-2 text-xs text-slate-400 line-through">
                {formatVND(form.price)}đ
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 5: Stock & Availability
          ═══════════════════════════════════════════════════ */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <SectionLabel icon={<Package size={14} />} text="Số lượng tồn kho" />
          <input
            type="number"
            min={0}
            value={form.stock || ""}
            onChange={(e) => updateField("stock", parseInt(e.target.value) || 0)}
            placeholder="0"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <SectionLabel icon={<Package size={14} />} text="Trạng thái kinh doanh" />
          <select
            value={form.availability}
            onChange={(e) => updateField("availability", e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white"
          >
            <option value="In Stock">Còn hàng (In Stock)</option>
            <option value="Out Of Stock">Hết hàng (Out Of Stock)</option>
            <option value="Discontinued">Ngừng kinh doanh (Discontinued)</option>
          </select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 6: Description
          ═══════════════════════════════════════════════════ */}
      <div>
        <SectionLabel icon={<Tag size={14} />} text="Mô tả sản phẩm" />
        <textarea
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Nhập mô tả chi tiết sản phẩm..."
          rows={4}
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 7: Toggles
          ═══════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <ToggleSwitch
            label=""
            checked={form.isFlashSale}
            onChange={(c) => updateField("isFlashSale", c)}
            color="amber"
          />
          <div className="flex items-center gap-1.5">
            <Flame size={15} className={form.isFlashSale ? "text-amber-500" : "text-slate-400"} />
            <span className={`text-sm font-medium ${form.isFlashSale ? "text-amber-700" : "text-slate-600"}`}>
              Khuyến mãi Flash
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <ToggleSwitch
            label=""
            checked={form.isFeatured}
            onChange={(c) => updateField("isFeatured", c)}
          />
          <div className="flex items-center gap-1.5">
            <Sparkles size={15} className={form.isFeatured ? "text-emerald-500" : "text-slate-400"} />
            <span className={`text-sm font-medium ${form.isFeatured ? "text-emerald-700" : "text-slate-600"}`}>
              Sản phẩm nổi bật
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          Footer Actions
          ═══════════════════════════════════════════════════ */}
      <div className="flex gap-3 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Đang lưu...
            </>
          ) : product ? (
            "Lưu thay đổi"
          ) : (
            "Tạo sản phẩm"
          )}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Sub-components                                         */
/* ─────────────────────────────────────────────────────── */

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
        {icon}
      </div>
      <span className="text-sm font-semibold text-slate-700">{text}</span>
    </div>
  );
}
