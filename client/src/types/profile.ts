/**
 * Profile Types
 * Type definitions for the user profile system
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: "user" | "admin" | "owner" | "deliverypartner";
  isActive: boolean;
  isTwoFactorEnabled: boolean;
  createdAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string | null;
  avatar?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  password: string;
  passwordConfirm: string;
}

export interface TwoFactorSetupResponse {
  qrCodeUrl: string;
  secret: string;
  backupCodes?: string[];
}

export interface TwoFactorStatusResponse {
  isTwoFactorEnabled: boolean;
}
