export type User = {
  id: string;
  name: string;
  email: string;
  role?: "user" | "admin" | "owner" | "deliverypartner";
  phone?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  isTwoFactorEnabled?: boolean;
  createdAt?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  captchaToken?: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  captchaToken?: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type VerifyAccountPayload = {
  email: string;
  verificationCode: string;
};

export type AuthResponse = {
  token?: string;
  message?: string;
  user?: User;
};
