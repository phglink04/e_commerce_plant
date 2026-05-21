/**
 * User Types
 * Định nghĩa cấu trúc người dùng
 */

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role?: "user" | "admin" | "owner" | "deliverypartner";
  isActive?: boolean;
  isTwoFactorEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
