"use client";

import { useRef, useState } from "react";
import { X, Upload, ImageIcon, Loader2 } from "lucide-react";
import api from "@/lib/api";
import type {
  HeroConfig,
  SaleConfig,
  FeaturedConfig,
  CategoriesConfig,
  ReviewConfig,
} from "@/types/home-settings";

/* ─── Sections that have NO configurable settings ─── */
const NON_CONFIGURABLE_SECTIONS = new Set([
  "whyChooseUs",
  "blogSection",
  "newsletter",
]);

type SectionConfigEditorProps = {
  sectionId: string;
  sectionTitle: string;
  currentConfig?: Record<string, unknown>;
  onSave: (config: Record<string, unknown>) => void;
  onClose: () => void;
};

export default function SectionConfigEditor({
  sectionId,
  sectionTitle,
  currentConfig,
  onSave,
  onClose,
}: SectionConfigEditorProps) {
  const [config, setConfig] = useState(currentConfig || {});

  const handleSave = () => {
    onSave(config);
  };

  const updateField = (key: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Render different editor based on section type
  const renderEditor = () => {
    if (NON_CONFIGURABLE_SECTIONS.has(sectionId)) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <span className="text-xl text-slate-400">⚙️</span>
          </div>
          <p className="text-sm font-medium text-slate-600">
            Section này không có cấu hình nào.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Chỉ có thể ẩn/hiện và thay đổi thứ tự.
          </p>
        </div>
      );
    }

    switch (sectionId) {
      case "hero":
        return (
          <HeroConfigEditor
            config={config as Partial<HeroConfig>}
            onUpdate={updateField}
          />
        );
      case "categories":
        return (
          <GridConfigEditor
            config={config as Partial<CategoriesConfig>}
            onUpdate={updateField}
            label="danh mục"
            defaultRows={1}
            defaultColumns={4}
            maxRows={3}
            maxColumns={6}
          />
        );
      case "saleProducts":
        return (
          <SaleConfigEditor
            config={config as Partial<SaleConfig>}
            onUpdate={updateField}
          />
        );
      case "featuredProducts":
        return (
          <GridConfigEditor
            config={config as Partial<FeaturedConfig>}
            onUpdate={updateField}
            label="sản phẩm nổi bật"
            defaultRows={2}
            defaultColumns={4}
            maxRows={4}
            maxColumns={6}
          />
        );
      case "reviewCarousel":
        return (
          <ReviewConfigEditor
            config={config as Partial<ReviewConfig>}
            onUpdate={updateField}
          />
        );
      default:
        return <div className="text-slate-500">No editor for this section</div>;
    }
  };

  const isNonConfigurable = NON_CONFIGURABLE_SECTIONS.has(sectionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Cấu hình: {sectionTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">{renderEditor()}</div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {isNonConfigurable ? "Đóng" : "Hủy"}
          </button>
          {!isNonConfigurable && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Lưu cấu hình
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Individual Section Editors
   ───────────────────────────────────────────────────────────── */

/**
 * Hero Section: title, subtitle, banner image
 */
function HeroConfigEditor({
  config,
  onUpdate,
}: {
  config: Partial<HeroConfig>;
  onUpdate: (key: string, value: unknown) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Vui lòng chọn file ảnh (jpg, png, webp...)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File ảnh quá lớn. Tối đa 5MB.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/api/home-settings/upload-banner", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        onUpdate("bannerImage", url);
      } else {
        setUploadError("Upload thành công nhưng không nhận được URL ảnh.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể upload ảnh. Kiểm tra kết nối Supabase.";
      setUploadError(msg);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Tiêu đề (Title)
        </label>
        <input
          type="text"
          value={(config.title as string) || ""}
          onChange={(e) => onUpdate("title", e.target.value)}
            placeholder="vd: Chào mừng đến PlantWorld"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Phụ đề (Subtitle)
        </label>
        <textarea
          value={(config.subtitle as string) || ""}
          onChange={(e) => onUpdate("subtitle", e.target.value)}
          rows={3}
            placeholder="vd: Khám phá những cây xanh tốt nhất cho nhà của bạn"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
        />
      </div>

      {/* Banner Image Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Ảnh banner
        </label>

        {/* Current preview */}
        {config.bannerImage ? (
          <div className="relative mb-3 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group">
            <img
              src={config.bannerImage as string}
              alt="Banner preview"
              className="w-full h-40 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "";
                (e.target as HTMLImageElement).alt = "Không tải được ảnh";
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg hover:bg-slate-50"
              >
                <Upload size={14} />
                Đổi ảnh
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-10 text-slate-400 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
          >
            {uploading ? (
              <Loader2 size={28} className="animate-spin" />
            ) : (
              <ImageIcon size={28} />
            )}
            <span className="text-sm font-medium">
              {uploading ? "Đang upload..." : "Click để chọn ảnh banner"}
            </span>
            <span className="text-xs">JPG, PNG, WebP — tối đa 5MB</span>
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload progress */}
        {uploading && config.bannerImage && (
          <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
            <Loader2 size={14} className="animate-spin" />
            Đang upload ảnh mới...
          </div>
        )}

        {/* Error */}
        {uploadError && (
          <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
            {uploadError}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Grid Config Editor — shared for Sale, Featured, Categories
 * Configures rows & columns (total items = rows × columns)
 */
function GridConfigEditor({
  config,
  onUpdate,
  label,
  defaultRows,
  defaultColumns,
  maxRows,
  maxColumns,
}: {
  config: Partial<{ rows: number; columns: number }>;
  onUpdate: (key: string, value: unknown) => void;
  label: string;
  defaultRows: number;
  defaultColumns: number;
  maxRows: number;
  maxColumns: number;
}) {
  const rows = (config.rows as number) || defaultRows;
  const columns = (config.columns as number) || defaultColumns;
  const totalItems = rows * columns;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">
          Cấu hình lưới hiển thị {label}
        </p>
        <p className="text-xs text-slate-500">
          Tổng số {label} hiển thị = Số hàng × Số cột ={" "}
          <span className="font-bold text-emerald-600">{totalItems}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Số hàng (Rows)
          </label>
          <input
            type="number"
            min={1}
            max={maxRows}
            value={rows}
            onChange={(e) =>
              onUpdate("rows", Math.max(1, Math.min(maxRows, Number(e.target.value) || 1)))
            }
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">Tối đa {maxRows} hàng</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Số cột (Columns)
          </label>
          <input
            type="number"
            min={1}
            max={maxColumns}
            value={columns}
            onChange={(e) =>
              onUpdate("columns", Math.max(1, Math.min(maxColumns, Number(e.target.value) || 1)))
            }
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">Tối đa {maxColumns} cột</p>
        </div>
      </div>

      {/* Visual grid preview */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Xem trước bố cục:</p>
        <div
          className="grid gap-1.5 rounded-lg border border-slate-200 bg-white p-3"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {Array.from({ length: totalItems }).map((_, i) => (
            <div
              key={i}
              className="flex h-8 items-center justify-center rounded bg-emerald-100 text-[10px] font-semibold text-emerald-700"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Review Section: perPage (quantity per load) and maxTotal (maximum)
 */
function ReviewConfigEditor({
  config,
  onUpdate,
}: {
  config: Partial<ReviewConfig>;
  onUpdate: (key: string, value: unknown) => void;
}) {
  const perPage = (config.perPage as number) || 3;
  const maxTotal = (config.maxTotal as number) || 12;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">
          Cấu hình hiển thị đánh giá
        </p>
        <p className="text-xs text-slate-500">
          Mỗi lần tải{" "}
          <span className="font-bold text-emerald-600">{perPage}</span> đánh
          giá, tối đa{" "}
          <span className="font-bold text-emerald-600">{maxTotal}</span> đánh
          giá.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Số lượng 1 lần tải (Per Page)
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={perPage}
            onChange={(e) =>
              onUpdate("perPage", Math.max(1, Math.min(10, Number(e.target.value) || 1)))
            }
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">1 – 10 đánh giá</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tổng tối đa (Max Total)
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={maxTotal}
            onChange={(e) =>
              onUpdate("maxTotal", Math.max(1, Math.min(50, Number(e.target.value) || 1)))
            }
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">1 – 50 đánh giá</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Sale Section: rows, columns, countdown end date, discount percentage
 */
function SaleConfigEditor({
  config,
  onUpdate,
}: {
  config: Partial<SaleConfig>;
  onUpdate: (key: string, value: unknown) => void;
}) {
  const rows = (config.rows as number) || 1;
  const columns = (config.columns as number) || 4;
  const totalItems = rows * columns;
  const discountPercent = (config.discountPercent as number) || 0;

  // Convert ISO date to datetime-local format for input
  const countdownValue = (() => {
    const raw = config.countdownEndDate as string | undefined;
    if (!raw) return "";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return "";
      // Format: YYYY-MM-DDTHH:mm
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  })();

  return (
    <div className="space-y-5">
      {/* ── Grid Config ── */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">
          Cấu hình lưới hiển thị sản phẩm sale
        </p>
        <p className="text-xs text-slate-500">
          Tổng số sản phẩm = Số hàng × Số cột ={" "}
          <span className="font-bold text-emerald-600">{totalItems}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Số hàng (Rows)
          </label>
          <input
            type="number"
            min={1}
            max={4}
            value={rows}
            onChange={(e) =>
              onUpdate("rows", Math.max(1, Math.min(4, Number(e.target.value) || 1)))
            }
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">Tối đa 4 hàng</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Số cột (Columns)
          </label>
          <input
            type="number"
            min={1}
            max={6}
            value={columns}
            onChange={(e) =>
              onUpdate("columns", Math.max(1, Math.min(6, Number(e.target.value) || 1)))
            }
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">Tối đa 6 cột</p>
        </div>
      </div>

      {/* Visual grid preview */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Xem trước bố cục:</p>
        <div
          className="grid gap-1.5 rounded-lg border border-slate-200 bg-white p-3"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {Array.from({ length: totalItems }).map((_, i) => (
            <div
              key={i}
              className="flex h-8 items-center justify-center rounded bg-rose-100 text-[10px] font-semibold text-rose-700"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* ── Countdown End Date ── */}
      <div className="border-t border-slate-200 pt-5">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-4">
          <p className="text-sm font-medium text-amber-800 mb-1">
            ⏰ Cấu hình đếm ngược Flash Sale
          </p>
          <p className="text-xs text-amber-600">
            Chọn ngày giờ kết thúc sale. Đồng hồ sẽ đếm ngược đến thời điểm này.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ngày giờ kết thúc sale
          </label>
          <input
            type="datetime-local"
            value={countdownValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                onUpdate("countdownEndDate", new Date(val).toISOString());
              } else {
                onUpdate("countdownEndDate", "");
              }
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          {countdownValue && (
            <p className="text-xs text-emerald-600 mt-1">
              ✓ Đếm ngược đến:{" "}
              {new Date(config.countdownEndDate as string).toLocaleString("vi-VN", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
          )}
          {!countdownValue && (
            <p className="text-xs text-slate-400 mt-1">
              Nếu không chọn, mặc định đếm ngược 48h từ lúc load trang.
            </p>
          )}
        </div>
      </div>

      {/* ── Discount Percentage ── */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Phần trăm giảm giá hiển thị (%)
        </label>
        <input
          type="number"
          min={0}
          max={99}
          value={discountPercent}
          onChange={(e) =>
            onUpdate("discountPercent", Math.max(0, Math.min(99, Number(e.target.value) || 0)))
          }
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">
          Hiển thị &quot;Up To {discountPercent || "??"}% OFF&quot; trên banner. Để 0 = tự tính từ sản phẩm.
        </p>
      </div>
    </div>
  );
}
