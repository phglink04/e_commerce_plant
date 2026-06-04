import axios from "axios";
import { getToken } from "@/lib/auth";

const resolvedBaseURL =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: resolvedBaseURL,
});

// Tự động gắn Authorization header cho mọi request
api.interceptors.request.use((config) => {
  if (
    typeof config.url === "string" &&
    typeof config.baseURL === "string" &&
    config.baseURL.endsWith("/api") &&
    config.url.startsWith("/api/")
  ) {
    config.url = config.url.replace(/^\/api/, "");
  }

  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers["Content-Type"];
    }
  } else {
    if (config.headers) {
      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }
    } else {
      config.headers = { "Content-Type": "application/json" } as any;
    }
  }

  return config;
});

// Xử lý lỗi 401 toàn cục (token hết hạn)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_role");
        document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
        document.cookie = "auth_role=; path=/; max-age=0; samesite=lax";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
