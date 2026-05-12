"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getRoleHomePath, normalizeRole } from "@/lib/role-routing";
import Turnstile from "./Turnstile";
import styles from "./auth-forms.module.css";

type GoogleCredentialResponse = {
  credential?: string;
};

export default function LoginForm() {
  const router = useRouter();
  const captchaRequired = process.env.NODE_ENV === "production";
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const {
    login,
    loginWithGoogle,
    loading,
    error,
    success,
    clearMessages,
    setError,
  } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isUnsupportedGoogleContext = () => {
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes("electron") || ua.includes(" wv") || ua.includes("webview")
    );
  };

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    const initializeGoogle = () => {
      const google = (
        window as typeof window & {
          google?: {
            accounts?: {
              id?: {
                initialize: (config: {
                  client_id: string;
                  callback: (response: GoogleCredentialResponse) => void;
                }) => void;
                prompt: () => void;
              };
            };
          };
        }
      ).google;

      if (!google?.accounts?.id) {
        return;
      }

      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: GoogleCredentialResponse) => {
          const idToken = response.credential;
          if (!idToken) {
            setError("Google did not return id token.");
            return;
          }

          clearMessages();
          const ok = await loginWithGoogle(idToken);
          if (ok) {
            const role = normalizeRole(useAuthStore.getState().user?.role);
            router.push(getRoleHomePath(role));
          }
        },
      });

      setGoogleReady(true);
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existingScript) {
      if ((window as typeof window & { google?: unknown }).google) {
        initializeGoogle();
      } else {
        existingScript.addEventListener("load", initializeGoogle, {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [clearMessages, googleClientId, loginWithGoogle, router, setError]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (captchaRequired && !captchaToken.trim()) {
      setError("Please complete captcha verification.");
      return;
    }

    const result = await login({ email, password, captchaToken });
    if (result === "ok") {
      const role = normalizeRole(useAuthStore.getState().user?.role);
      router.push(getRoleHomePath(role));
    } else if (result === "2fa") {
      router.push("/auth/2fa");
    }
  };

  const onGoogleLogin = () => {
    clearMessages();

    if (isUnsupportedGoogleContext()) {
      setError(
        "Google Sign-In is blocked in embedded webview. Open this page in Chrome/Edge/Firefox to continue with Google.",
      );
      return;
    }

    if (!googleClientId) {
      setError("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend env.");
      return;
    }

    const google = (
      window as typeof window & {
        google?: {
          accounts?: {
            id?: {
              prompt: () => void;
            };
          };
        };
      }
    ).google;

    if (!googleReady || !google?.accounts?.id) {
      setError("Google Sign-In is still loading. Please try again.");
      return;
    }

    google.accounts.id.prompt();
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Welcome Back</h1>
          <p className={styles.formSubtitle}>
            Sign in to your account to continue
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
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {captchaRequired && (
            <div className={styles.formGroup}>
              <Turnstile
                onToken={setCaptchaToken}
                onError={(error) => {
                  console.error("Turnstile error:", error);
                  setError("Security verification failed. Please try again.");
                }}
                onExpire={() => {
                  setCaptchaToken("");
                  setError("Security verification expired. Please try again.");
                }}
                theme="light"
                size="normal"
              />
            </div>
          )}

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <button
          className={styles.googleBtn}
          type="button"
          onClick={onGoogleLogin}
          disabled={loading}
        >
          <svg
            className={styles.googleIcon}
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className={styles.footer}>
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className={styles.link}>
              Create one
            </Link>
          </p>
          <Link href="/auth/forgot-password" className={styles.link}>
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}
