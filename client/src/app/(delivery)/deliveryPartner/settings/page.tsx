"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  Shield,
  KeyRound
} from "lucide-react";
import { useProfileInfo, useSecurity } from "@/hooks/useProfile";
import { normalizeImageSrc } from "@/utils/utils";

export default function DeliveryPartnerSettingsPage() {
  const {
    profile,
    loading: profileLoading,
    updating: profileUpdating,
    updateProfile,
    uploadAvatar,
  } = useProfileInfo();

  const {
    loading: securityLoading,
    error: securityError,
    success: securitySuccess,
    changePassword,
    setError: setSecurityError,
    setSuccess: setSecuritySuccess,
  } = useSecurity();

  // Profile Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileToast, setProfileToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localSecurityError, setLocalSecurityError] = useState("");

  // Initialize profile values when loaded
  if (profile && !initialized) {
    setName(profile.name || "");
    setPhone(profile.phone || "");
    setInitialized(true);
  }

  // Auto-clear alert/toast messages after 4 seconds
  useEffect(() => {
    if (profileToast) {
      const timer = setTimeout(() => setProfileToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [profileToast]);

  useEffect(() => {
    if (securitySuccess || securityError || localSecurityError) {
      const timer = setTimeout(() => {
        setSecuritySuccess("");
        setSecurityError(null);
        setLocalSecurityError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [securitySuccess, securityError, localSecurityError, setSecurityError, setSecuritySuccess]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileToast(null);

    if (!name.trim()) {
      setProfileToast({ message: "Tên là bắt buộc", type: "error" });
      return;
    }

    if (/^\d/.test(name.trim())) {
      setProfileToast({ message: "Họ tên không được phép bắt đầu bằng chữ số", type: "error" });
      return;
    }

    let cleanPhone: string | null = null;
    if (phone.trim()) {
      cleanPhone = phone.trim().replace(/[\s.()-]/g, "");
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(cleanPhone)) {
        setProfileToast({
          message: "Số điện thoại không hợp lệ (định dạng Việt Nam, ví dụ: 0912345678)",
          type: "error",
        });
        return;
      }
    }

    try {
      await updateProfile({ name: name.trim(), phone: cleanPhone });
      setProfileToast({ message: "Cập nhật hồ sơ thành công!", type: "success" });
    } catch {
      setProfileToast({ message: "Cập nhật hồ sơ thất bại", type: "error" });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileToast({ message: "Ảnh phải nhỏ hơn 5MB", type: "error" });
      return;
    }

    try {
      await uploadAvatar(file);
      setProfileToast({ message: "Cập nhật ảnh đại diện thành công!", type: "success" });
    } catch {
      setProfileToast({ message: "Tải ảnh đại diện thất bại", type: "error" });
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalSecurityError("");
    setSecurityError(null);
    setSecuritySuccess("");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setLocalSecurityError(
        "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số."
      );
      return;
    }

    if (password !== passwordConfirm) {
      setLocalSecurityError("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    try {
      await changePassword({ currentPassword, password, passwordConfirm });
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirm("");
    } catch {
      // error is automatically set in the hook
    }
  };

  if (profileLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Đang tải cấu hình tài khoản...</p>
      </div>
    );
  }

  const activeSecurityError = localSecurityError || securityError?.message || "";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Cấu hình tài khoản</h2>
        <p className="text-sm text-slate-500">Cập nhật thông tin cá nhân và thay đổi mật khẩu đăng nhập của bạn</p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Profile Card */}
        <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <User size={20} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Thông Tin Cá Nhân</h3>
              <p className="text-xs text-slate-500 font-medium">Quản lý hồ sơ công việc bưu tá</p>
            </div>
          </div>

          {profileToast && (
            <div
              className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-sm mb-5 shadow-xs transition-all duration-300 ${
                profileToast.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-rose-50 border-rose-100 text-rose-700"
              }`}
            >
              {profileToast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span className="font-semibold">{profileToast.message}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Avatar Uploader */}
              <div className="flex flex-col sm:flex-row items-center gap-5 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="relative group overflow-hidden h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-extrabold text-2xl border-4 border-white shadow-md">
                  {profile?.avatar ? (
                    <img
                      src={normalizeImageSrc(profile.avatar)}
                      alt={profile.name || "Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{profile?.name?.charAt(0).toUpperCase() || "B"}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={profileUpdating}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white"
                    title="Thay đổi ảnh đại diện"
                  >
                    <Camera size={20} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h4 className="font-bold text-slate-700 text-sm">Ảnh đại diện bưu tá</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Nhấp vào ảnh để thay đổi. Định dạng hỗ trợ: JPG, PNG, WebP. Tối đa 5MB.
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="profile-name">
                  Họ và tên *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="profile-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ tên của bạn"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="profile-phone">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="vd: 0912 345 678"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="profile-email">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="profile-email"
                    type="email"
                    disabled
                    value={profile?.email || ""}
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-400 cursor-not-allowed outline-none"
                  />
                </div>
                <p className="text-[10px] font-semibold text-slate-400">Email dùng để đăng nhập và không thể thay đổi</p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={profileUpdating}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50"
              >
                {profileUpdating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Lưu Thay Đổi
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Password Card */}
        <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Shield size={20} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Đổi Mật Khẩu</h3>
              <p className="text-xs text-slate-500 font-medium">Bảo vệ tài khoản và tăng độ an toàn mật khẩu</p>
            </div>
          </div>

          {activeSecurityError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-sm mb-5 shadow-xs text-rose-700 transition-all duration-300">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <span className="font-semibold leading-normal">{activeSecurityError}</span>
            </div>
          )}

          {securitySuccess && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 p-3.5 text-sm mb-5 shadow-xs text-emerald-700 transition-all duration-300">
              <CheckCircle size={18} />
              <span className="font-semibold">{securitySuccess}</span>
            </div>
          )}

          <form onSubmit={handleSecuritySubmit} className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="current-pwd">
                  Mật khẩu hiện tại *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="current-pwd"
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang sử dụng"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="new-pwd">
                  Mật khẩu mới *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="new-pwd"
                    type={showNew ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự (hoa, thường, số)"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="confirm-pwd">
                  Xác nhận mật khẩu mới *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirm-pwd"
                    type={showConfirm ? "text" : "password"}
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={securityLoading}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50"
              >
                {securityLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang đổi...
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    Cập Nhật Mật Khẩu
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
