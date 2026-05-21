"use client";

import { useState, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Key,
} from "lucide-react";
import { profileService } from "@/services/profile.service";
import { useFetch } from "@/hooks/useFetch";

type Step = "idle" | "setup" | "verify" | "disable";

export default function TwoFactorSettings() {
  const {
    data: status,
    loading,
    refetch,
  } = useFetch(() => profileService.get2faStatus(), []);

  const [step, setStep] = useState<Step>("idle");
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [error, setError] = useState("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 4000);
  };

  const handleSetup = useCallback(async () => {
    setSubmitting(true);
    setError("");
    try {
      const data = await profileService.setup2fa();
      setQrUrl(data.qrCodeUrl || "");
      setSecret(data.secret || "");
      setStep("setup");
    } catch {
      showToast("Thiết lập 2FA thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (code.length < 6) {
      setError("Nhập mã 6 chữ số hợp lệ");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await profileService.verify2fa(code);
      if (result.backupCodes) {
        setBackupCodes(result.backupCodes);
      }
      setStep("idle");
      setCode("");
      await refetch();
      showToast("Đã bật xác thực 2 lớp!");
    } catch {
      setError("Mã xác thực không hợp lệ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }, [code, refetch]);

  const handleDisable = useCallback(async () => {
    if (code.length < 6) {
      setError("Nhập mã 6 chữ số hợp lệ");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await profileService.disable2fa(code);
      setStep("idle");
      setCode("");
      setBackupCodes([]);
      await refetch();
      showToast("Đã tắt xác thực 2 lớp");
    } catch {
      setError("Mã không hợp lệ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }, [code, refetch]);

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    showToast("Đã sao chép mã bí mật");
  };

  const isEnabled = status?.isTwoFactorEnabled ?? false;

  if (loading) {
    return (
      <div className="pf-skeleton-wrap">
        <div className="pf-skeleton pf-skeleton--card" />
      </div>
    );
  }

  return (
    <div className="pf-2fa" id="two-factor-settings">
      {toast && (
        <div className={`pf-toast pf-toast--${toastType}`} role="alert">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Backup Codes Modal */}
      {backupCodes.length > 0 && (
        <div className="pf-modal-backdrop" onClick={() => setBackupCodes([])}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pf-modal__header">
              <h3>
                <Key size={18} />
                Mã Dự Phòng
              </h3>
            </div>
            <div className="pf-modal__body">
              <p className="pf-2fa__backup-note">
                Lưu các mã dự phòng này ở nơi an toàn. Bạn có thể sử dụng chúng
                để truy cập tài khoản nếu mất thiết bị xác thực.
              </p>
              <div className="pf-2fa__codes-grid">
                {backupCodes.map((bc, i) => (
                  <code key={i} className="pf-2fa__code">
                    {bc}
                  </code>
                ))}
              </div>
            </div>
            <div className="pf-modal__footer">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join("\n"));
                  showToast("Đã sao chép mã dự phòng");
                }}
                className="pf-btn pf-btn--ghost"
              >
                <Copy size={14} />
                Sao Chép Tất Cả
              </button>
              <button
                onClick={() => setBackupCodes([])}
                className="pf-btn pf-btn--primary"
              >
                Đã Lưu Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Card */}
      <div className="pf-2fa__status-card">
        <div className="pf-2fa__status-icon">
          {isEnabled ? (
            <ShieldCheck size={32} className="pf-text-green" />
          ) : (
            <ShieldOff size={32} className="pf-text-muted" />
          )}
        </div>
        <div className="pf-2fa__status-text">
          <h3>Xác Thực Hai Lớp</h3>
          <p>
            {isEnabled
              ? "Tài khoản của bạn được bảo vệ bởi xác thực 2 lớp. Mã xác thực được yêu cầu khi đăng nhập."
              : "Thêm một lớp bảo mật bằng cách bật xác thực hai lớp."}
          </p>
          <span
            className={`pf-2fa__badge ${isEnabled ? "pf-2fa__badge--enabled" : "pf-2fa__badge--disabled"}`}
          >
            {isEnabled ? "Đang bật" : "Đang tắt"}
          </span>
        </div>
      </div>

      {/* Actions */}
      {step === "idle" && (
        <div className="pf-2fa__actions">
          {isEnabled ? (
            <button
              onClick={() => {
                setStep("disable");
                setCode("");
                setError("");
              }}
              className="pf-btn pf-btn--danger-outline"
              id="disable-2fa-btn"
            >
              <ShieldOff size={16} />
              Tắt 2FA
            </button>
          ) : (
            <button
              onClick={handleSetup}
              className="pf-btn pf-btn--primary"
              disabled={submitting}
              id="enable-2fa-btn"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="pf-spin" />
                  Đang thiết lập…
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Bật 2FA
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Setup Step */}
      {step === "setup" && (
        <div className="pf-2fa__setup">
          <h4>Bước 1: Quét mã QR</h4>
          <p>
            Quét mã QR này bằng ứng dụng xác thực (Google Authenticator,
            Authy, v.v.)
          </p>

          {qrUrl && (
            <div className="pf-2fa__qr">
              <img src={qrUrl} alt="2FA QR Code" width={200} height={200} />
            </div>
          )}

          {secret && (
            <div className="pf-2fa__secret">
              <p>Hoặc nhập mã thủ công:</p>
              <div className="pf-2fa__secret-row">
                <code>{secret}</code>
                <button
                  onClick={copySecret}
                  className="pf-btn pf-btn--ghost pf-btn--sm"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}

          <h4>Bước 2: Xác thực mã</h4>
          <p>Nhập mã 6 chữ số từ ứng dụng xác thực:</p>

          {error && <div className="pf-alert pf-alert--error">{error}</div>}

          <div className="pf-2fa__verify-row">
            <input
              type="text"
              className="pf-form__input pf-2fa__code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              id="2fa-verify-input"
            />
            <button
              onClick={handleVerify}
              className="pf-btn pf-btn--primary"
              disabled={submitting || code.length < 6}
              id="verify-2fa-btn"
            >
              {submitting ? (
                <Loader2 size={16} className="pf-spin" />
              ) : (
                "Xác Thực & Bật"
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setStep("idle");
              setCode("");
              setError("");
            }}
            className="pf-btn pf-btn--ghost"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Disable Step */}
      {step === "disable" && (
        <div className="pf-2fa__setup">
          <h4>Tắt Xác Thực Hai Lớp</h4>
          <p>Nhập mã từ ứng dụng xác thực để tắt 2FA:</p>

          {error && <div className="pf-alert pf-alert--error">{error}</div>}

          <div className="pf-2fa__verify-row">
            <input
              type="text"
              className="pf-form__input pf-2fa__code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              id="2fa-disable-input"
            />
            <button
              onClick={handleDisable}
              className="pf-btn pf-btn--danger"
              disabled={submitting || code.length < 6}
              id="confirm-disable-2fa"
            >
              {submitting ? (
                <Loader2 size={16} className="pf-spin" />
              ) : (
                "Tắt 2FA"
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setStep("idle");
              setCode("");
              setError("");
            }}
            className="pf-btn pf-btn--ghost"
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  );
}
