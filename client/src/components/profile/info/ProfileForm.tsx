"use client";

import { useState, useRef } from "react";
import { Camera, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useProfileInfo } from "@/hooks/useProfile";

export default function ProfileForm() {
  const {
    profile,
    loading,
    updating,
    updateProfile,
    uploadAvatar,
  } = useProfileInfo();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [initialized, setInitialized] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Initialize form values when profile loads
  if (profile && !initialized) {
    setName(profile.name || "");
    setPhone(profile.phone || "");
    setInitialized(true);
  }

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Tên là bắt buộc", "error");
      return;
    }

    if (/^\d/.test(name.trim())) {
      showToast("Họ tên không được phép bắt đầu bằng chữ số", "error");
      return;
    }

    let cleanPhone: string | null = null;
    if (phone.trim()) {
      cleanPhone = phone.trim().replace(/[\s.()-]/g, "");
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(cleanPhone)) {
        showToast(
          "Số điện thoại không hợp lệ (định dạng Việt Nam, ví dụ: 0912345678)",
          "error",
        );
        return;
      }
    }

    try {
      await updateProfile({ name: name.trim(), phone: cleanPhone });
      showToast("Cập nhật hồ sơ thành công");
    } catch {
      showToast("Cập nhật hồ sơ thất bại", "error");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Ảnh phải nhỏ hơn 5MB", "error");
      return;
    }

    try {
      await uploadAvatar(file);
      showToast("Cập nhật ảnh đại diện thành công");
    } catch {
      showToast("Tải ảnh đại diện thất bại", "error");
    }
  };

  if (loading) {
    return (
      <div className="pf-skeleton-wrap">
        <div className="pf-skeleton pf-skeleton--avatar" />
        <div className="pf-skeleton pf-skeleton--line" />
        <div className="pf-skeleton pf-skeleton--line pf-skeleton--short" />
        <div className="pf-skeleton pf-skeleton--line" />
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className={`pf-toast pf-toast--${toastType}`} role="alert">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="pf-form" id="profile-info-form">
        {/* Avatar Section */}
        <div className="pf-form__avatar-section">
          <div className="pf-form__avatar-wrap">
            <div className="pf-form__avatar">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.name} />
              ) : (
                <span className="pf-form__avatar-initial">
                  {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <button
              type="button"
              className="pf-form__avatar-btn"
              onClick={() => fileRef.current?.click()}
              disabled={updating}
              id="upload-avatar-btn"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="pf-sr-only"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="pf-form__avatar-text">
            <p className="pf-form__avatar-hint">
              Nhấp vào biểu tượng máy ảnh để thay đổi ảnh đại diện
            </p>
            <p className="pf-form__avatar-size">Tối đa 5MB · JPG, PNG, WebP</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="pf-form__fields">
          <div className="pf-form__group">
            <label htmlFor="profile-name" className="pf-form__label">
              Họ và tên
            </label>
            <input
              id="profile-name"
              type="text"
              className="pf-form__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ và tên"
              required
            />
          </div>

          <div className="pf-form__group">
            <label htmlFor="profile-email" className="pf-form__label">
              Địa chỉ Email
            </label>
            <input
              id="profile-email"
              type="email"
              className="pf-form__input pf-form__input--disabled"
              value={profile?.email || ""}
              disabled
            />
            <p className="pf-form__hint">Email không thể thay đổi</p>
          </div>

          <div className="pf-form__group">
            <label htmlFor="profile-phone" className="pf-form__label">
              Số điện thoại
            </label>
            <input
              id="profile-phone"
              type="tel"
              className="pf-form__input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="vd: 0912 345 678"
            />
          </div>

          <div className="pf-form__group">
            <label className="pf-form__label">Ngày tạo tài khoản</label>
            <p className="pf-form__static">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="pf-form__actions">
          <button
            type="submit"
            className="pf-btn pf-btn--primary"
            disabled={updating}
            id="save-profile-btn"
          >
            {updating ? (
              <>
                <Loader2 size={18} className="pf-spin" />
                Đang lưu…
              </>
            ) : (
              <>
                <Save size={18} />
                Lưu Thay Đổi
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
