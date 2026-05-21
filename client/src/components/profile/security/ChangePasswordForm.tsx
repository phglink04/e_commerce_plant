"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useSecurity } from "@/hooks/useProfile";

export default function ChangePasswordForm() {
  const { loading, error, success, changePassword, setError, setSuccess } =
    useSecurity();

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setError(null);
    setSuccess("");

    if (password.length < 6) {
      setLocalError("Mật khẩu phải có ít nhất 6 ký tự");
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
    <form
      onSubmit={handleSubmit}
      className="pf-security-form"
      id="change-password-form"
    >
      <div className="pf-security-form__header">
        <Lock size={20} />
        <div>
          <h3>Đổi Mật Khẩu</h3>
          <p>Sử dụng mật khẩu dài và ngẫu nhiên để bảo vệ tài khoản của bạn.</p>
        </div>
      </div>

      {displayError && (
        <div className="pf-alert pf-alert--error">{displayError}</div>
      )}

      {success && (
        <div className="pf-alert pf-alert--success">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      <div className="pf-form__group">
        <label htmlFor="current-password" className="pf-form__label">
          Mật khẩu hiện tại
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

      <div className="pf-form__group">
        <label htmlFor="new-password" className="pf-form__label">
          Mật khẩu mới
        </label>
        <div className="pf-form__input-wrap">
          <input
            id="new-password"
            type={showNew ? "text" : "password"}
            className="pf-form__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
            required
            minLength={6}
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

      <div className="pf-form__group">
        <label htmlFor="confirm-password" className="pf-form__label">
          Xác nhận mật khẩu mới
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
  );
}
