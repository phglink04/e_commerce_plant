"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, Save, Loader2, CheckCircle2, Mail } from "lucide-react";
import { useSecurity } from "@/hooks/useProfile";
import { useAuthStore } from "@/store/auth-store";

export default function ChangePasswordForm() {
  const { loading, error, success, changePassword, setError, setSuccess } =
    useSecurity();

  const user = useAuthStore((state) => state.user);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);

  const [activeMode, setActiveMode] = useState<"change" | "forgot">("change");

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState("");

  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

  // Auto-clear alert messages after 4 seconds
  useEffect(() => {
    if (success || error || forgotSuccess || forgotError || localError) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError(null);
        setForgotSuccess("");
        setForgotError("");
        setLocalError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [
    success,
    error,
    forgotSuccess,
    forgotError,
    localError,
    setError,
    setSuccess,
  ]);

  const handleForgotPasswordClick = async () => {
    if (!user?.email) {
      setForgotError("Không tìm thấy email của bạn để gửi khôi phục.");
      return;
    }

    setForgotLoading(true);
    setForgotSuccess("");
    setForgotError("");
    setLocalError("");
    setError(null);
    setSuccess("");

    try {
      const isSuccess = await forgotPassword({ email: user.email });
      if (isSuccess) {
        setForgotSuccess(
          `Đã gửi liên kết khôi phục mật khẩu đến email ${user.email}. Vui lòng kiểm tra hộp thư.`
        );
      } else {
        setForgotError(
          "Không thể gửi yêu cầu khôi phục mật khẩu. Vui lòng thử lại sau."
        );
      }
    } catch (err: any) {
      setForgotError(err?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setError(null);
    setSuccess("");
    setForgotSuccess("");
    setForgotError("");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setLocalError(
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số."
      );
      return;
    }

    if (password !== passwordConfirm) {
      setLocalError("Mật khẩu không khớp");
      return;
    }

    try {
      await changePassword({ currentPassword, password, passwordConfirm });
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirm("");
    } catch {
      // error is set in the hook
    }
  };

  const displayError = localError || error?.message || "";

  return (
    <div className="pf-security-form" id="change-password-container">
      <div className="pf-security-form__header" style={{ marginBottom: "20px" }}>
        <Lock size={20} />
        <div>
          <h3>Bảo mật & Mật khẩu</h3>
          <p>Chọn phương thức cập nhật hoặc khôi phục mật khẩu của bạn.</p>
        </div>
      </div>

      {/* Modern Tabs */}
      <div
        className="pf-security-tabs"
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          background: "rgba(255, 255, 255, 0.03)",
          padding: "4px",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveMode("change");
            setError(null);
            setSuccess("");
            setForgotSuccess("");
            setForgotError("");
            setLocalError("");
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "8px",
            border: "none",
            background: activeMode === "change" ? "#10b981" : "transparent",
            color: activeMode === "change" ? "#ffffff" : "#94a3b8",
            fontWeight: "600",
            fontSize: "13.5px",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
        >
          Đổi mật khẩu
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveMode("forgot");
            setError(null);
            setSuccess("");
            setForgotSuccess("");
            setForgotError("");
            setLocalError("");
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "8px",
            border: "none",
            background: activeMode === "forgot" ? "#10b981" : "transparent",
            color: activeMode === "forgot" ? "#ffffff" : "#94a3b8",
            fontWeight: "600",
            fontSize: "13.5px",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
        >
          Quên mật khẩu cũ
        </button>
      </div>

      {/* Alerts */}
      {displayError && activeMode === "change" && (
        <div className="pf-alert pf-alert--error" style={{ marginBottom: "16px" }}>
          {displayError}
        </div>
      )}

      {success && activeMode === "change" && (
        <div className="pf-alert pf-alert--success" style={{ marginBottom: "16px" }}>
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {forgotError && activeMode === "forgot" && (
        <div className="pf-alert pf-alert--error" style={{ marginBottom: "16px" }}>
          {forgotError}
        </div>
      )}

      {forgotSuccess && activeMode === "forgot" && (
        <div className="pf-alert pf-alert--success" style={{ marginBottom: "16px" }}>
          <CheckCircle2 size={16} />
          {forgotSuccess}
        </div>
      )}

      {/* TAB 1: Change Password Form */}
      {activeMode === "change" && (
        <form onSubmit={handleSubmit} id="change-password-form">
          <div className="pf-form__group" style={{ marginBottom: "16px" }}>
            <label htmlFor="current-password" className="pf-form__label">
              Mật khẩu hiện tại *
            </label>
            <div className="pf-form__input-wrap">
              <input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                className="pf-form__input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                required
              />
              <button
                type="button"
                className="pf-form__input-toggle"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pf-form__group" style={{ marginBottom: "16px" }}>
            <label htmlFor="new-password" className="pf-form__label">
              Mật khẩu mới *
            </label>
            <div className="pf-form__input-wrap">
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                className="pf-form__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                required
                minLength={8}
              />
              <button
                type="button"
                className="pf-form__input-toggle"
                onClick={() => setShowNew(!showNew)}
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pf-form__group" style={{ marginBottom: "24px" }}>
            <label htmlFor="confirm-password" className="pf-form__label">
              Xác nhận mật khẩu mới *
            </label>
            <div className="pf-form__input-wrap">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                className="pf-form__input"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                required
              />
              <button
                type="button"
                className="pf-form__input-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pf-form__actions">
            <button
              type="submit"
              className="pf-btn pf-btn--primary"
              disabled={loading}
              id="change-password-btn"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="pf-spin" />
                  Đang cập nhật…
                </>
              ) : (
                <>
                  <Save size={16} />
                  Cập Nhật Mật Khẩu
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Forgot Password Card */}
      {activeMode === "forgot" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "20px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#34d399",
                flexShrink: 0,
              }}
            >
              <Mail size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, color: "#f8fafc", fontSize: "15px", fontWeight: 600 }}>
                Khôi Phục Bằng Liên Kết Email
              </h4>
              <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "13px", lineHeight: "1.5" }}>
                Nếu bạn không nhớ mật khẩu cũ, hệ thống sẽ gửi một liên kết an toàn đến hòm thư đã đăng ký để bạn tạo lại mật khẩu mới.
              </p>
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.04)",
            }}
          >
            <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>
              Gửi liên kết khôi phục tới Email:
            </span>
            <strong style={{ fontSize: "14.5px", color: "#34d399", wordBreak: "break-all" }}>
              {user?.email || "Chưa cập nhật email"}
            </strong>
          </div>

          <button
            type="button"
            onClick={handleForgotPasswordClick}
            disabled={forgotLoading}
            className="pf-btn pf-btn--primary"
            style={{ width: "100%", justifyContent: "center", height: "42px" }}
            id="forgot-password-send-btn"
          >
            {forgotLoading ? (
              <>
                <Loader2 size={16} className="pf-spin" />
                Đang gửi yêu cầu...
              </>
            ) : (
              <>
                <Mail size={16} />
                Gửi Liên Kết Khôi Phục
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
