"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import Turnstile from "./Turnstile";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Loader2, Leaf, ArrowRight, ShieldCheck } from "lucide-react";

type GoogleCredentialResponse = {
  credential?: string;
};

const backgroundLeaves = [
  { id: 1, size: 24, left: "8%", delay: 0, duration: 14 },
  { id: 2, size: 16, left: "22%", delay: 2, duration: 18 },
  { id: 3, size: 28, left: "40%", delay: 5, duration: 12 },
  { id: 4, size: 20, left: "68%", delay: 1, duration: 16 },
  { id: 5, size: 22, left: "85%", delay: 3, duration: 15 },
];

export default function RegisterForm() {
  const router = useRouter();
  const captchaRequired = process.env.NODE_ENV === "production";
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const {
    register,
    loginWithGoogle,
    loading,
    error,
    success,
    clearMessages,
    setError,
  } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error, clearMessages]);

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
                renderButton: (
                  parent: HTMLElement,
                  options: {
                    theme?: string;
                    size?: string;
                    width?: number | string;
                    text?: string;
                    shape?: string;
                    logo_alignment?: string;
                  }
                ) => void;
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
            setError("Google không trả về ID token hợp lệ.");
            return;
          }

          clearMessages();
          const ok = await loginWithGoogle(idToken);
          if (ok) {
            router.push("/");
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

  useEffect(() => {
    if (googleReady && googleButtonRef.current) {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: 384,
          text: "signup_with",
          shape: "rectangular",
          logo_alignment: "center",
        });
      }
    }
  }, [googleReady]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (name.trim().length < 2) {
      setError("Họ và tên phải có tối thiểu 2 ký tự.");
      return;
    }

    if (/^\d/.test(name.trim())) {
      setError("Họ tên không được phép bắt đầu bằng chữ số.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.",
      );
      return;
    }

    if (captchaRequired && !captchaToken.trim()) {
      setError("Vui lòng hoàn tất xác minh bảo mật.");
      return;
    }

    const ok = await register({
      name,
      email,
      password,
      confirmPassword,
      captchaToken,
    });
    if (ok) {
      router.push("/auth/verify-account");
    }
  };

  const onGoogleSignup = () => {
    clearMessages();
    const ua = navigator.userAgent.toLowerCase();
    const isUnsupportedContext =
      ua.includes("electron") || ua.includes(" wv") || ua.includes("webview");

    if (isUnsupportedContext) {
      setError(
        "Đăng ký Google bị chặn trong webview. Vui lòng mở trang này trong Chrome/Edge/Firefox để tiếp tục.",
      );
      return;
    }

    if (!googleClientId) {
      setError("Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID trong cấu hình.");
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
      setError("Đăng ký Google đang tải. Vui lòng thử lại.");
      return;
    }

    google.accounts.id.prompt();
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-[#f8fafc] via-[#ecfdf5] to-[#f0fdf4] overflow-hidden py-12 px-4 select-none">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-100/30 blur-3xl pointer-events-none" />

      {/* Floating leaves */}
      {backgroundLeaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          className="absolute text-emerald-600/10 pointer-events-none"
          style={{ left: leaf.left, top: -40 }}
          animate={{
            y: ["0vh", "110vh"],
            x: ["0px", "30px", "-30px", "0px"],
            rotate: [0, 360],
          }}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            delay: leaf.delay,
            ease: "linear",
          }}
        >
          <Leaf size={leaf.size} fill="currentColor" />
        </motion.div>
      ))}

      {/* Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-white/75 backdrop-blur-xl border border-emerald-500/10 rounded-3xl shadow-[0_20px_50px_rgba(4,120,87,0.05)] p-8 md:p-10 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(4,120,87,0.08)]"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-14 h-14 bg-gradient-to-tr from-emerald-500/10 to-green-500/20 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm cursor-pointer mb-4"
          >
            <Leaf size={28} className="fill-emerald-500/10" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#064e3b] tracking-tight">Tạo Tài Khoản</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Tham gia và khám phá thế giới cây xanh PlantWorld</p>
        </div>

        {/* Error / Success Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium mb-6 shadow-sm"
            >
              <span className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-xs">!</span>
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3.5 rounded-xl text-sm font-medium mb-6 shadow-sm"
            >
              <ShieldCheck className="flex-shrink-0 w-5 h-5 text-emerald-600" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name input */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Họ và tên
            </label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-250" size={18} />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: Nguyễn Văn A (tối thiểu 2 ký tự, không bắt đầu bằng số)"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder-slate-300"
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Địa chỉ Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-250" size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vd: customer@plantworld.com"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder-slate-300"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mật khẩu
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-250" size={18} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (vd: PlantWorld123)"
                required
                className="w-full pl-11 pr-12 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder-slate-300"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 p-1 rounded-md transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 leading-normal pl-1">
              Mật khẩu dài từ 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.
            </p>
          </div>

          {/* Confirm Password input */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Xác nhận mật khẩu
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-250" size={18} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu để xác nhận"
                required
                className="w-full pl-11 pr-12 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder-slate-300"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 p-1 rounded-md transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Turnstile Captcha */}
          {captchaRequired && (
            <div className="pt-2">
              <Turnstile
                onToken={setCaptchaToken}
                onError={(error) => {
                  console.error("Turnstile error:", error);
                  setError("Xác minh bảo mật thất bại. Vui lòng thử lại.");
                }}
                onExpire={() => {
                  setCaptchaToken("");
                  setError("Xác minh bảo mật đã hết hạn. Vui lòng thử lại.");
                }}
                theme="light"
                size="normal"
              />
            </div>
          )}

          {/* Submit button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.25)] transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-75 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Đang tạo tài khoản...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Tạo Tài Khoản
                <ArrowRight size={16} />
              </span>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        {googleClientId && (
          <>
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative px-3 bg-white/75 backdrop-blur-xl text-xs font-bold text-slate-400 uppercase tracking-wider">hoặc</span>
            </div>

            {/* Google register */}
            <div className="w-full flex justify-center min-h-[48px]">
              <div 
                ref={googleButtonRef} 
                className="w-full [&&_iframe]:w-full [&&_iframe]:max-w-full" 
              />
            </div>
            {/*
            <button
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 text-sm shadow-sm hover:shadow-md disabled:opacity-60"
              type="button"
              onClick={onGoogleSignup}
              disabled={loading}
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#ea4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2-3.414 0-6.19-2.775-6.19-6.185 0-3.41 2.776-6.184 6.19-6.184 1.554 0 2.969.577 4.053 1.528l3.125-3.127C19.123 2.658 15.89 1.5 11.99 1.5 6.2 1.5 1.5 6.2 1.5 1.5 11.99c0 5.79 4.7 10.49 10.49 10.49 5.79 0 10.49-4.7 10.49-10.49 0-.583-.05-1.16-.145-1.705H12.24z"
                />
              </svg>
              Đăng ký với Google
            </button>
            */}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm font-semibold text-slate-500">
          Đã có tài khoản?{" "}
          <Link href="/auth/login" className="text-emerald-600 hover:text-[#064e3b] transition-colors underline decoration-emerald-500/30 hover:decoration-emerald-600 underline-offset-4">
            Đăng nhập ngay
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
