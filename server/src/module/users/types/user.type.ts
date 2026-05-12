export type StoredUser = {
  id: string;
  name: string;
  email: string;
  accountType: "LOCAL" | "GOOGLE";
  googleId: string | null;
  role: "user" | "admin" | "owner" | "deliverypartner";
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  passwordHash: string;
  isVerified: boolean;
  verificationCode: string | null;
  verificationCodeExpiresAt: string | null;
  resetToken: string | null;
  resetTokenExpiresAt: string | null;
  isTwoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  backupCodes: string[];
  cart: Array<{
    plantId: string;
    quantity: number;
    price: number;
  }>;
  addresses: Array<{
    id: string;
    fullName: string;
    phone: string;
    addressLine: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  accountType: "LOCAL" | "GOOGLE";
  role: "user" | "admin" | "owner" | "deliverypartner";
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  isTwoFactorEnabled: boolean;
};
