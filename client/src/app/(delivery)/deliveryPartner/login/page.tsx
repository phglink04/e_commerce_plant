"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Mail, Lock, Shield, ArrowRight, Eye, EyeOff, AlertCircle, Truck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DeliveryPartnerLoginPage() {
  const router = useRouter();
  const { login, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const ok = await login({
      email,
      password,
      captchaToken: "delivery-login",
      targetRole: "deliverypartner",
    });
    const nextUser = useAuthStore.getState().user;
    setLoading(false);

    if (!ok) {
      setError(useAuthStore.getState().error || "Email hoặc mật khẩu không chính xác.");
      return;
    }

    if (!nextUser || nextUser.role !== "deliverypartner") {
      useAuthStore.getState().logout();
      setError("Tài khoản không hợp lệ");
      return;
    }

    router.push("/deliveryPartner/orders");
  };

  return (
    <div className="delivery-login-portal">
      {/* ── Dark Forest Background Orbs ── */}
      <div className="delivery-glow delivery-glow--top" />
      <div className="delivery-glow delivery-glow--bottom" />

      {/* ── Main Centered Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="delivery-card"
      >
        {/* Brand Header */}
        <div className="delivery-header">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="delivery-logo"
          >
            <Truck size={28} className="logo-icon" />
          </motion.div>
          <h1 className="delivery-title">PlantWorld</h1>
          <p className="delivery-subtitle">Hệ Thống Đối Tác Vận Chuyển</p>
        </div>

        {/* Status Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="delivery-alert delivery-alert--error"
            >
              <AlertCircle size={16} className="alert-icon" />
              <span>{error}</span>
            </motion.div>
          )}

          {user && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="delivery-alert delivery-alert--success"
            >
              <Shield size={16} className="alert-icon" />
              <span>Đang đăng nhập: {user.email}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={onSubmit} className="delivery-form">
          {/* Email input field */}
          <div className="input-group">
            <label className="input-label" htmlFor="delivery-email">Email Vận chuyển</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="delivery-email"
                type="email"
                placeholder="shipper@plantworld.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="delivery-input"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="input-group">
            <label className="input-label" htmlFor="delivery-password">Mật khẩu bảo mật</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="delivery-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="delivery-input"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember details / helper block */}
          <div className="form-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" className="delivery-checkbox" />
              <label htmlFor="remember" className="checkbox-label">Duy trì đăng nhập</label>
            </div>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Vui lòng liên hệ Admin hệ thống để khôi phục mật khẩu đối tác vận chuyển."); }} className="forgot-password">
              Quên mật khẩu?
            </a>
          </div>

          {/* Submit Action Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="delivery-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Đang xác thực hệ thống...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Đăng Nhập Vận Chuyển
                <ArrowRight size={16} className="arrow-icon" />
              </span>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* ── Inline CSS Styles for Perfect Standalone Design ── */}
      <style jsx global>{`
        .delivery-login-portal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: radial-gradient(circle at 50% 50%, #061f18 0%, #030806 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'Lexend', 'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          z-index: 99999;
          padding: 1.5rem;
        }

        /* Background blur glows */
        .delivery-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(140px);
          pointer-events: none;
          z-index: 1;
        }

        .delivery-glow--top {
          top: -10%;
          right: 15%;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(0, 0, 0, 0) 70%);
        }

        .delivery-glow--bottom {
          bottom: -15%;
          left: 10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(5, 150, 105, 0.12) 0%, rgba(0, 0, 0, 0) 70%);
        }

        /* Glassmorphism Portal Card */
        .delivery-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 460px;
          background: rgba(10, 18, 15, 0.7);
          backdrop-filter: blur(25px) saturate(130%);
          -webkit-backdrop-filter: blur(25px) saturate(130%);
          border: 1px solid rgba(16, 185, 129, 0.18);
          border-radius: 28px;
          padding: 2.75rem 2.5rem;
          box-shadow: 
            0 25px 60px rgba(0, 0, 0, 0.65),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 0 40px rgba(16, 185, 129, 0.03);
        }

        /* Branding header */
        .delivery-header {
          text-align: center;
          margin-bottom: 2.25rem;
        }

        .delivery-logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.05) 100%);
          border: 1.5px solid rgba(16, 185, 129, 0.35);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          box-shadow: 
            0 8px 20px rgba(16, 185, 129, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .logo-icon {
          color: #10b981;
          filter: drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4));
        }

        .delivery-title {
          font-size: 1.85rem;
          font-weight: 900;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.5px;
          background: linear-gradient(to right, #ffffff, #a7f3d0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .delivery-subtitle {
          font-size: 0.85rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0.4rem 0 0;
        }

        /* Alerts system */
        .delivery-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-radius: 14px;
          padding: 0.9rem 1.2rem;
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.4;
          margin-bottom: 1.75rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }

        .delivery-alert--error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
        }

        .delivery-alert--success {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #a7f3d0;
        }

        .alert-icon {
          flex-shrink: 0;
        }

        /* Interactive Form */
        .delivery-form {
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .input-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #cbd5e1;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1.1rem;
          color: #64748b;
          pointer-events: none;
          transition: color 0.25s ease;
        }

        .delivery-input {
          width: 100%;
          background: rgba(15, 23, 42, 0.35);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 0.95rem 1.1rem 0.95rem 2.85rem;
          color: #ffffff;
          font-size: 0.92rem;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .delivery-input:hover {
          border-color: rgba(16, 185, 129, 0.25);
          background: rgba(15, 23, 42, 0.45);
        }

        .delivery-input:focus {
          border-color: #10b981;
          background: rgba(15, 23, 42, 0.55);
          box-shadow: 
            0 0 0 4px rgba(16, 185, 129, 0.15),
            inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .delivery-input:focus + .input-icon {
          color: #10b981;
        }

        .password-toggle {
          position: absolute;
          right: 1.1rem;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.2rem;
          border-radius: 6px;
          transition: color 0.2s ease, background-color 0.2s ease;
        }

        .password-toggle:hover {
          color: #10b981;
          background-color: rgba(255, 255, 255, 0.05);
        }

        /* Form options: checkbox & links */
        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-top: 0.2rem;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .delivery-checkbox {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          outline: none;
          background: rgba(15, 23, 42, 0.4);
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }

        .delivery-checkbox:checked {
          background: #10b981;
          border-color: #10b981;
        }

        .delivery-checkbox:checked::after {
          content: "";
          position: absolute;
          left: 4.5px;
          top: 1.5px;
          width: 4px;
          height: 8px;
          border: solid #ffffff;
          border-width: 0 1.5px 1.5px 0;
          transform: rotate(45deg);
        }

        .checkbox-label {
          color: #94a3b8;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
        }

        .forgot-password {
          color: #10b981;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .forgot-password:hover {
          color: #34d399;
          text-decoration: underline;
        }

        /* Premium Submit Button */
        .delivery-submit-btn {
          margin-top: 0.75rem;
          width: 100%;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          border: none;
          border-radius: 14px;
          padding: 1rem;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 
            0 8px 24px rgba(5, 150, 105, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .delivery-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #047857 0%, #059669 100%);
          box-shadow: 
            0 12px 30px rgba(5, 150, 105, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .delivery-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          background: rgba(16, 185, 129, 0.25);
          box-shadow: none;
        }

        .arrow-icon {
          transition: transform 0.25s ease;
        }

        .delivery-submit-btn:hover .arrow-icon {
          transform: translateX(3px);
        }
      `}</style>
    </div>
  );
}
