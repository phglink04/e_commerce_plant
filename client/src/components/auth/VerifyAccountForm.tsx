"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, KeyRound, Loader2, Leaf, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

const backgroundLeaves = [
  { id: 1, size: 24, left: "8%", delay: 0, duration: 14 },
  { id: 2, size: 16, left: "22%", delay: 2, duration: 18 },
  { id: 3, size: 28, left: "40%", delay: 5, duration: 12 },
  { id: 4, size: 20, left: "68%", delay: 1, duration: 16 },
  { id: 5, size: 22, left: "85%", delay: 3, duration: 15 },
];

export default function VerifyAccountForm() {
  const router = useRouter();
  const { verifyAccount, sendActivation, loading, error, success, clearMessages } = useAuthStore();
  
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error, clearMessages]);

  useEffect(() => {
    const pendingEmail = localStorage.getItem("pending_verification_email");
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (verificationCode.trim().length !== 6) {
      useAuthStore.getState().setError("Mã xác thực phải gồm đúng 6 chữ số.");
      return;
    }

    const ok = await verifyAccount({ email, verificationCode });
    if (ok) {
      localStorage.removeItem("pending_verification_email");
      localStorage.removeItem("pending_verification_code");
      setTimeout(() => router.push("/auth/login"), 1500);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0 || resendLoading) return;
    if (!email) {
      useAuthStore.getState().setError("Vui lòng điền địa chỉ email trước khi yêu cầu gửi lại mã.");
      return;
    }

    clearMessages();
    setResendLoading(true);
    const ok = await sendActivation({ email });
    setResendLoading(false);

    if (ok) {
      setCooldown(60); // 60 seconds cooldown
    }
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
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#064e3b] tracking-tight">Xác Thực Tài Khoản</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Vui lòng nhập mã xác thực gửi tới hòm thư email của bạn</p>
        </div>

        {/* Alerts */}
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
        <form onSubmit={onSubmit} className="space-y-5">
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

          {/* Verification Code input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="verificationCode" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mã xác thực
              </label>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={cooldown > 0 || resendLoading}
                className="text-xs font-bold text-emerald-600 hover:text-[#064e3b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {resendLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                {cooldown > 0 ? `Gửi lại mã sau (${cooldown}s)` : "Gửi lại mã xác thực"}
              </button>
            </div>
            <div className="relative group">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-250" size={18} />
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="Nhập mã xác thực gồm 6 chữ số"
                maxLength={6}
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold tracking-widest outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder-slate-300 placeholder:tracking-normal"
              />
            </div>
            <p className="text-[11px] font-semibold text-slate-400 leading-normal pl-1">
              Kiểm tra hòm thư Spam (thư rác) hoặc Quảng cáo nếu bạn không tìm thấy mã trong Hộp thư đến.
            </p>
          </div>

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
                Đang xác thực...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Xác Thực Tài Khoản
                <ArrowRight size={16} />
              </span>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm font-semibold text-slate-500">
          <Link href="/auth/login" className="text-emerald-600 hover:text-[#064e3b] transition-colors underline decoration-emerald-500/30 hover:decoration-emerald-600 underline-offset-4">
            Quay lại đăng nhập
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
