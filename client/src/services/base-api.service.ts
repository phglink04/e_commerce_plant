/**
 * Base API Service
 * Xử lý các concern chung cho tất cả API calls
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";
import { ApiResponse, ApiError } from "@/types";

export class BaseApiService {
  protected client: AxiosInstance;
  protected baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL =
      baseURL ||
      process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ||
      "http://localhost:5000";

    this.client = axios.create({
      baseURL: this.baseURL,
    });

    // Request interceptor: Thêm Authorization header
    this.client.interceptors.request.use((config) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

      if (token) {
        if (config.headers && typeof config.headers.set === "function") {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          } as any;
        }
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

    // Response interceptor: Xử lý lỗi toàn cục
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<any>) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            localStorage.removeItem("auth_role");
            // Redirect to login or emit event
          }
        }

        return Promise.reject(this.handleError(error));
      },
    );
  }

  protected handleError(error: AxiosError<any>): ApiError {
    const statusCode = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Có lỗi xảy ra, vui lòng thử lại";

    return {
      message,
      statusCode,
      data: error.response?.data,
    };
  }

  protected async request<T>(
    config: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<ApiResponse<T>>(config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  protected async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request({ ...config, method: "GET", url });
  }

  protected async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request({ ...config, method: "POST", url, data });
  }

  protected async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request({ ...config, method: "PATCH", url, data });
  }

  protected async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request({ ...config, method: "DELETE", url });
  }

  /**
   * Upload file - wrapper cho FormData requests
   */
  protected async uploadFile<T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const { "Content-Type": _, ...headers } = config?.headers || {};
    return this.request({
      ...config,
      method: "POST",
      url,
      data: formData,
      headers,
    });
  }

  /**
   * Upload file via PATCH - wrapper cho FormData PATCH requests
   */
  protected async uploadFilePatch<T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const { "Content-Type": _, ...headers } = config?.headers || {};
    return this.request({
      ...config,
      method: "PATCH",
      url,
      data: formData,
      headers,
    });
  }
}
