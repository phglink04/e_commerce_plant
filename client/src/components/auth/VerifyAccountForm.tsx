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
          <h1 className={styles.formTitle}>Verify Account</h1>
          <p className={styles.formSubtitle}>
            Enter the verification code sent to your email
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
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="verificationCode" className={styles.label}>
              Verification Code
            </label>
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.toUpperCase())
              }
              className={styles.input}
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
            />
            <p className={styles.inputHint}>
              Check your email for the verification code
            </p>
          </div>

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Verifying...
              </>
            ) : (
              "Verify Account"
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/auth/login" className={styles.link}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
