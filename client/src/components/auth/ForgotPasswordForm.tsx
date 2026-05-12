"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import styles from "./auth-forms.module.css";

export default function ForgotPasswordForm() {
  const { forgotPassword, loading, error, success, clearMessages } =
    useAuthStore();
  const [email, setEmail] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    await forgotPassword({ email });
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Reset Password</h1>
          <p className={styles.formSubtitle}>
            Enter your email to receive a reset link
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

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Sending...
              </>
            ) : (
              "Send Reset Link"
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
