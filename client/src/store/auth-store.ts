import { create } from "zustand";
import api from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth";
import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
  VerifyAccountPayload,
} from "@/types/auth";

type AuthState = {
  user: User | null;
  token: string | null;
  twoFactorUserId: string | null; // Lưu userId khi cần xác thực 2FA
  loading: boolean;
  error: string;
  success: string;
  hasHydrated: boolean;
  setError: (value: string) => void;
  setUser: (user: User | null) => void;
  hydrateFromStorage: () => void;
  clearMessages: () => void;
  login: (payload: LoginPayload) => Promise<"ok" | "2fa" | false>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<boolean>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<boolean>;
  verifyAccount: (payload: VerifyAccountPayload) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => void;
};

const parseError = (err: unknown, fallback: string): string => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } })
      .response;
    return response?.data?.message ?? fallback;
  }

  return fallback;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  twoFactorUserId: null,
  loading: false,
  error: "",
  success: "",
  hasHydrated: false,

  setError: (value) => set({ error: value }),

  setUser: (user) => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("auth_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("auth_user");
      }
    }

    set({ user });
  },

  hydrateFromStorage: () => {
    if (typeof window === "undefined") {
      return;
    }

    const storedUser = localStorage.getItem("auth_user");
    const storedToken = localStorage.getItem("auth_token");

    set({
      user: storedUser ? (JSON.parse(storedUser) as User) : null,
      token: storedToken,
      hasHydrated: true,
    });
  },

  clearMessages: () => set({ error: "", success: "" }),

  login: async (payload) => {
    try {
      set({ loading: true, error: "", success: "" });
      const response = await api.post("/api/users/login", payload);

      // Handle 2FA required
      if (response.data?.requiresTwoFactor) {
        set({
          loading: false,
          twoFactorUserId: response.data.userId ?? null,
          error: "",
        });
        return "2fa";
      }

      const token = response.data?.token ?? response.data?.access_token;
      const user = response.data?.data?.user ?? response.data?.user;

      if (!token || !user) {
        set({ loading: false, error: "Invalid login response" });
        return false;
      }

      setToken(token, user.role ?? null);
      localStorage.setItem("auth_user", JSON.stringify(user));
      if (user.role) {
        localStorage.setItem("auth_role", user.role);
      }
      set({
        token,
        user,
        twoFactorUserId: null,
        loading: false,
        success: "Login successful",
      });
      return "ok";
    } catch (err) {
      set({ loading: false, error: parseError(err, "Login failed") });
      return false;
    }
  },

  register: async (payload) => {
    try {
      set({ loading: true, error: "", success: "" });
      const response = await api.post("/api/users/signup", {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        passwordConfirm: payload.confirmPassword,
        captchaToken: payload.captchaToken,
      });

      const verificationCode = response.data?.data?.verificationCode as
        | string
        | undefined;

      if (typeof window !== "undefined") {
        localStorage.setItem("pending_verification_email", payload.email);
        if (verificationCode) {
          localStorage.setItem("pending_verification_code", verificationCode);
        }
      }

      set({
        loading: false,
        success: verificationCode
          ? `Registration successful. Verification code: ${verificationCode}`
          : "Registration successful. Please verify your account.",
      });
      return true;
    } catch (err) {
      set({ loading: false, error: parseError(err, "Registration failed") });
      return false;
    }
  },

  forgotPassword: async (payload) => {
    try {
      set({ loading: true, error: "", success: "" });
      await api.post("/api/users/forgetPassword", payload);
      set({ loading: false, success: "Reset link sent. Check your email." });
      return true;
    } catch (err) {
      set({ loading: false, error: parseError(err, "Forgot password failed") });
      return false;
    }
  },

  resetPassword: async (payload) => {
    try {
      set({ loading: true, error: "", success: "" });
      await api.patch(`/api/users/resetPassword/${payload.token}`, {
        password: payload.newPassword,
        passwordConfirm: payload.confirmPassword,
      });
      set({ loading: false, success: "Password reset successful" });
      return true;
    } catch (err) {
      set({ loading: false, error: parseError(err, "Reset password failed") });
      return false;
    }
  },

  verifyAccount: async (payload) => {
    try {
      set({ loading: true, error: "", success: "" });
      await api.post("/api/auth/verify-account", payload);
      set({ loading: false, success: "Account verification successful" });
      return true;
    } catch (err) {
      set({ loading: false, error: parseError(err, "Verify account failed") });
      return false;
    }
  },

  loginWithGoogle: async (idToken) => {
    try {
      set({ loading: true, error: "", success: "" });

      const response = await api.post("/api/auth/google-auth", { idToken });
      const token = response.data?.token ?? response.data?.access_token;
      const user = response.data?.data?.user ?? response.data?.user;

      if (!token || !user) {
        set({ loading: false, error: "Invalid Google login response" });
        return false;
      }

      setToken(token, user.role ?? null);
      localStorage.setItem("auth_user", JSON.stringify(user));
      if (user.role) {
        localStorage.setItem("auth_role", user.role);
      }
      set({ token, user, loading: false, success: "Login successful" });
      return true;
    } catch (err) {
      set({ loading: false, error: parseError(err, "Google login failed") });
      return false;
    }
  },

  logout: () => {
    clearToken();
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_role");
    set({
      token: null,
      user: null,
      twoFactorUserId: null,
      error: "",
      success: "Logged out",
    });
  },
}));
