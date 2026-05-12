"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import styles from "./auth-forms.module.css";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, loading, error, success, clearMessages, setError } =
    useAuthStore();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!token) {
      setError("Reset link is invalid or missing token.");
      return;
    }

    const ok = await resetPassword({ token, newPassword, confirmPassword });
    if (ok) {
      setTimeout(() => router.push("/auth/login"), 1500);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Set New Password</h1>
          <p className={styles.formSubtitle}>
            Create a strong password for your account
          </p>
        </div>

        {!token && (
          <div className={styles.alertError}>
            <span className={styles.alertIcon}>⚠️</span>
            Reset link is invalid. Please request a new reset link from the
            forgot password page.
          </div>
        )}

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
            <label htmlFor="newPassword" className={styles.label}>
              New Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex={-1}
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className={styles.inputHint}>At least 8 characters</p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            className={styles.submitBtn}
            type="submit"
            disabled={loading || !token}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Updating...
              </>
            ) : (
              "Reset Password"
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

import Link from "next/link";
