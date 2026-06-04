"use client";

import { useCallback, useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Save,
} from "lucide-react";
import api from "@/lib/api";
import type { HomeSettingsData, SectionConfig } from "@/types/home-settings";
import { DEFAULT_HOME_TEMPLATE } from "@/lib/default-home-template";
import SectionConfigEditor from "@/components/admin/home-settings/SectionConfigEditor";
import HomePagePreview from "@/components/admin/home-settings/HomePagePreview";
import Toast from "@/components/admin/ui/admin-toast";
import { normalizeImageSrc } from "@/utils/utils";

type Toast = {
  type: "success" | "error" | "info";
  message: string;
};

export default function AdminHomeSettingsPage() {
  const [settings, setSettings] = useState<HomeSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploadingLogo(true);
      const res = await api.post("/api/home-settings/upload-banner", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const url = res.data?.url;
      if (url) {
        setSettings((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            logo: url,
          };
        });
        setToast({
          type: "success",
          message: "✓ Tải lên logo thành công! Nhấn 'Lưu thay đổi' để lưu lại.",
        });
      }
    } catch (err: any) {
      console.error(err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Không thể tải lên ảnh logo.",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/api/home-settings");
        const data = res.data?.data?.settings as HomeSettingsData | undefined;

        if (data) {
          setSettings(data);
        } else {
          setSettings(DEFAULT_HOME_TEMPLATE);
        }
      } catch (error) {
        console.error(error);
        setSettings(DEFAULT_HOME_TEMPLATE);
        setToast({
          type: "error",
          message: "Không thể tải cấu hình, đang sử dụng cấu hình mặc định",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination || !settings) return;

    const items = Array.from(settings.sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order field
    const updatedSections = items.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setSettings({ ...settings, sections: updatedSections });
  };

  // Toggle section visibility
  const handleToggleVisibility = useCallback((sectionId: string) => {
    setSettings((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        sections: prev.sections.map((sec) =>
          sec.sectionId === sectionId
            ? { ...sec, isVisible: !sec.isVisible }
            : sec,
        ),
      };
    });
  }, []);

  // Toggle expanded section in UI
  const toggleSectionExpanded = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Update section config
  const handleUpdateSectionConfig = useCallback(
    (sectionId: string, config: Record<string, unknown>) => {
      setSettings((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          sectionConfigs: {
            ...prev.sectionConfigs,
            [sectionId]: config,
          },
        };
      });
    },
    [],
  );

  // Save all settings
  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      await api.patch("/api/home-settings", settings);

      setToast({
        type: "success",
        message: "✓ Thiết lập trang chủ đã được lưu thành công!",
      });

      // Revalidate homepage
      if (typeof window !== "undefined") {
        try {
          await fetch("/api/revalidate?path=/", {
            method: "POST",
          });
        } catch {
          // Silently fail
        }
      }
    } catch (error) {
      console.error(error);
      setToast({
        type: "error",
        message: "Không thể lưu thiết lập trang chủ",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Đang tải thiết lập trang chủ...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>Không thể tải cấu hình thiết lập</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Trình dựng Trang chủ
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý các phần hiển thị, sắp xếp thứ tự và cấu hình trang chủ của bạn
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <Save size={16} />
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Section Manager */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-lg text-slate-900 mb-4">
              Thứ tự hiển thị
            </h2>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="home-sections">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-2 transition-colors ${
                      snapshot.isDraggingOver ? "bg-emerald-50 rounded p-2" : ""
                    }`}
                  >
                    {settings.sections.map((section, index) => (
                      <Draggable
                        key={section.sectionId}
                        draggableId={section.sectionId}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              snapshot.isDragging
                                ? "bg-emerald-100 border-emerald-400 shadow-lg"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-400"
                            >
                              <GripVertical size={16} />
                            </div>

                            {/* Section Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {section.title}
                              </p>
                              <p className="text-xs text-slate-400">
                                #{index + 1}
                              </p>
                            </div>

                            {/* Visibility Toggle */}
                            <button
                              onClick={() =>
                                handleToggleVisibility(section.sectionId)
                              }
                              className="flex-shrink-0 p-1.5 hover:bg-slate-200 rounded transition-colors"
                              title={section.isVisible ? "Ẩn" : "Hiện"}
                            >
                              {section.isVisible ? (
                                <Eye size={16} className="text-emerald-600" />
                              ) : (
                                <EyeOff size={16} className="text-slate-400" />
                              )}
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() =>
                                setEditingSectionId(section.sectionId)
                              }
                              className="flex-shrink-0 p-1.5 hover:bg-slate-200 rounded transition-colors"
                              title="Chỉnh sửa cấu hình"
                            >
                              <Pencil size={16} className="text-slate-600" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-lg text-slate-900">Xem trước giao diện</h2>
              <p className="text-xs text-slate-500 mt-1">
                Xem hiển thị thực tế trang chủ của bạn
              </p>
            </div>

            {/* Preview Container */}
            <div className="overflow-x-auto bg-slate-50">
              <div className="inline-block min-w-full p-6">
                <div className="bg-white border-2 border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <HomePagePreview settings={settings} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Website Logo Config Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div>
          <h3 className="font-bold text-lg text-slate-900">
            Logo Website
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tải lên và thay đổi logo thương hiệu hiển thị trên tất cả các trang của khách hàng, admin, và đối tác vận chuyển.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Logo Hiện Tại</span>
            <div className="h-16 w-32 border border-slate-200 rounded-lg flex items-center justify-center bg-slate-900 p-2">
              <img
                src={settings.logo ? normalizeImageSrc(settings.logo) : "/frontend/logo/logo.png"}
                alt="Logo website"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>

          <div className="flex-1 w-full space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Chọn File Logo Mới
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isUploadingLogo}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-emerald-50 file:text-emerald-700
                  hover:file:bg-emerald-100 disabled:opacity-50"
              />
              {isUploadingLogo && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 shrink-0" />
              )}
            </div>
            <p className="text-xs text-slate-400">
              Hỗ trợ file ảnh định dạng PNG, JPEG, SVG hoặc WebP. Khuyến nghị tỷ lệ ngang (ví dụ: 240x80px).
            </p>
          </div>
        </div>
      </div>

      {/* Footer Config Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <button
          onClick={() => toggleSectionExpanded("footer")}
          className="flex items-center justify-between w-full"
        >
          <h3 className="font-bold text-lg text-slate-900">
            Thông tin chân trang (Footer)
          </h3>
          <ChevronDown
            size={20}
            className={`transition-transform ${
              expandedSections.has("footer") ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSections.has("footer") && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                value={settings.footerInfo.address}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    footerInfo: {
                      ...settings.footerInfo,
                      address: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={settings.footerInfo.phone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    footerInfo: {
                      ...settings.footerInfo,
                      phone: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={settings.footerInfo.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    footerInfo: {
                      ...settings.footerInfo,
                      email: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Đường dẫn Facebook
              </label>
              <input
                type="url"
                value={settings.footerInfo.facebookLink}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    footerInfo: {
                      ...settings.footerInfo,
                      facebookLink: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section Editor Modal */}
      {editingSectionId && settings && (
        <SectionConfigEditor
          sectionId={editingSectionId}
          sectionTitle={
            settings.sections.find((s) => s.sectionId === editingSectionId)
              ?.title || editingSectionId
          }
          currentConfig={
            settings.sectionConfigs[
              editingSectionId as keyof typeof settings.sectionConfigs
            ] as Record<string, unknown> | undefined
          }
          onSave={(config) => {
            handleUpdateSectionConfig(editingSectionId, config);
            setEditingSectionId(null);
          }}
          onClose={() => setEditingSectionId(null)}
        />
      )}
    </div>
  );
}
