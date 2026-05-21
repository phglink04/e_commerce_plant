"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import styles from "./auth-forms.module.css";

export default function VerifyAccountForm() {
  const router = useRouter();
  const { verifyAccount, loading, error, success, clearMessages } =
    useAuthStore();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    const pendingEmail = localStorage.getItem("pending_verification_email");
    const pendingCode = localStorage.getItem("pending_verification_code");

    if (pendingEmail) {
      setEmail(pendingEmail);
    }

    if (pendingCode) {
      setVerificationCode(pendingCode);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const ok = await verifyAccount({ email, verificationCode });

    if (ok) {
      localStorage.removeItem("pending_verification_email");
      localStorage.removeItem("pending_verification_code");
      setTimeout(() => router.push("/auth/login"), 1500);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Xác Thực Tài Khoản</h1>
          <p className={styles.formSubtitle}>
            Nhập mã xác thực đã gửi đến email của bạn
          </p>
        </div>

        {error && (
          <div className={styles.alertError}>
            <span className={styles.alertIcon}>⚠️</span>
            {error}
          </div>
        )}
        {success && (
          <div className={styles.alertSuccess}>
            <span className={styles.alertIcon}>✓</span>
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Địa chỉ Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="abc@example.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="verificationCode" className={styles.label}>
              Mã xác thực
            </label>
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.toUpperCase())
              }
              className={styles.input}
              placeholder="Nhập mã 6 chữ số"
              maxLength={6}
              required
            />
            <p className={styles.inputHint}>
              Kiểm tra email để lấy mã xác thực
            </p>
          </div>

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Đang xác thực...
              </>
            ) : (
              "Xác Thực Tài Khoản"
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/auth/login" className={styles.link}>
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
