import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PublicUser, StoredUser } from "./types/user.type";
import { User } from "./schemas/user.schema";

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? new Date().toISOString()
      : value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findByEmail(email: string): Promise<StoredUser | null> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .lean();
    return user ? this.toStoredUser(user) : null;
  }

  async findByResetToken(token: string): Promise<StoredUser | null> {
    const user = await this.userModel.findOne({ resetToken: token }).lean();
    return user ? this.toStoredUser(user) : null;
  }

  async findById(userId: string): Promise<StoredUser | null> {
    const user = await this.userModel.findById(userId).lean();
    return user ? this.toStoredUser(user) : null;
  }

  async getAll(): Promise<StoredUser[]> {
    const users = await this.userModel.find().lean();
    return users.map((user) => this.toStoredUser(user));
  }

  async searchForAdmin(query: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<{
    users: StoredUser[];
    totalResults: number;
    page: number;
    totalPages: number;
    limit: number;
  }> {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.max(1, Number(query.limit ?? 10) || 10);
    const normalizedRole = query.role?.trim().toLowerCase();
    const normalizedSearch = query.search?.trim();

    const filter: Record<string, unknown> = {};

    if (normalizedRole) {
      filter.role = normalizedRole;
    }

    if (normalizedSearch) {
      const escaped = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ name: { $regex: regex } }, { email: { $regex: regex } }];
    }

    const totalResults = await this.userModel.countDocuments(filter);
    const docs = await this.userModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      users: docs.map((item) => this.toStoredUser(item)),
      totalResults,
      page,
      totalPages: Math.max(1, Math.ceil(totalResults / limit)),
      limit,
    };
  }

  async create(payload: {
    name: string;
    email: string;
    passwordHash: string;
    verificationCode?: string | null;
    verificationCodeExpiresAt?: string | null;
    accountType?: "LOCAL" | "GOOGLE";
    googleId?: string | null;
    role?: "user" | "admin" | "owner" | "deliverypartner";
    isVerified?: boolean;
    isTwoFactorEnabled?: boolean;
    twoFactorSecret?: string | null;
    backupCodes?: string[];
    phone?: string | null;
    avatar?: string | null;
    isActive?: boolean;
    addresses?: Array<{
      id: string;
      fullName: string;
      phone: string;
      addressLine: string;
    }>;
  }): Promise<StoredUser> {
    const created = await this.userModel.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      accountType: payload.accountType ?? "LOCAL",
      googleId: payload.googleId ?? null,
      role: payload.role ?? "user",
      phone: payload.phone ?? null,
      avatar: payload.avatar ?? null,
      isActive: payload.isActive ?? true,
      passwordHash: payload.passwordHash,
      isVerified:
        payload.isVerified ??
        (payload.role === "admin" || payload.role === "owner"),
      verificationCode: payload.verificationCode ?? null,
      verificationCodeExpiresAt: payload.verificationCodeExpiresAt ?? null,
      resetToken: null,
      resetTokenExpiresAt: null,
      isTwoFactorEnabled: payload.isTwoFactorEnabled ?? false,
      twoFactorSecret: payload.twoFactorSecret ?? null,
      backupCodes: payload.backupCodes ?? [],
      cart: [],
      addresses: payload.addresses ?? [],
    });

    return this.toStoredUser(created.toObject());
  }

  async update(updatedUser: StoredUser): Promise<void> {
    await this.userModel.findByIdAndUpdate(updatedUser.id, {
      name: updatedUser.name,
      email: updatedUser.email.toLowerCase(),
      accountType: updatedUser.accountType,
      googleId: updatedUser.googleId,
      role: updatedUser.role,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      isActive: updatedUser.isActive,
      passwordHash: updatedUser.passwordHash,
      isVerified: updatedUser.isVerified,
      verificationCode: updatedUser.verificationCode,
      verificationCodeExpiresAt: updatedUser.verificationCodeExpiresAt,
      resetToken: updatedUser.resetToken,
      resetTokenExpiresAt: updatedUser.resetTokenExpiresAt,
      isTwoFactorEnabled: updatedUser.isTwoFactorEnabled,
      twoFactorSecret: updatedUser.twoFactorSecret,
      backupCodes: updatedUser.backupCodes,
      cart: updatedUser.cart,
      addresses: updatedUser.addresses,
      updatedAt: updatedUser.updatedAt,
    });
  }

  async replaceAll(users: StoredUser[]): Promise<void> {
    const ids = users.map((user) => user.id);
    await this.userModel.deleteMany({ _id: { $nin: ids } });

    await Promise.all(
      users.map((user) =>
        this.userModel.findByIdAndUpdate(
          user.id,
          {
            name: user.name,
            email: user.email.toLowerCase(),
            accountType: user.accountType,
            googleId: user.googleId,
            role: user.role,
            phone: user.phone,
            avatar: user.avatar,
            isActive: user.isActive,
            passwordHash: user.passwordHash,
            isVerified: user.isVerified,
            verificationCode: user.verificationCode,
            verificationCodeExpiresAt: user.verificationCodeExpiresAt,
            resetToken: user.resetToken,
            resetTokenExpiresAt: user.resetTokenExpiresAt,
            isTwoFactorEnabled: user.isTwoFactorEnabled,
            twoFactorSecret: user.twoFactorSecret,
            backupCodes: user.backupCodes,
            cart: user.cart,
            addresses: user.addresses,
            updatedAt: user.updatedAt,
          },
          { upsert: true },
        ),
      ),
    );
  }

  toPublicUser(user: StoredUser): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.isActive,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };
  }

  private toStoredUser(user: {
    _id: unknown;
    name: string;
    email: string;
    accountType: "LOCAL" | "GOOGLE";
    googleId: string | null;
    role: "user" | "admin" | "owner" | "deliverypartner";
    phone: string | null;
    avatar: string | null;
    isActive?: boolean;
    passwordHash: string;
    isVerified: boolean;
    verificationCode: string | null;
    verificationCodeExpiresAt: string | null;
    resetToken: string | null;
    resetTokenExpiresAt: string | null;
    isTwoFactorEnabled: boolean;
    twoFactorSecret: string | null;
    backupCodes: string[];
    cart: Array<{ plantId: unknown; quantity: number; price: number }>;
    addresses?: Array<{
      id: string;
      fullName: string;
      phone: string;
      addressLine: string;
    }>;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
  }): StoredUser {
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      accountType: user.accountType ?? "LOCAL",
      googleId: user.googleId ?? null,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.isActive ?? true,
      passwordHash: user.passwordHash,
      isVerified: user.isVerified,
      verificationCode: user.verificationCode,
      verificationCodeExpiresAt: user.verificationCodeExpiresAt,
      resetToken: user.resetToken,
      resetTokenExpiresAt: user.resetTokenExpiresAt,
      isTwoFactorEnabled: user.isTwoFactorEnabled ?? false,
      twoFactorSecret: user.twoFactorSecret ?? null,
      backupCodes: user.backupCodes ?? [],
      cart: (user.cart ?? []).map((item) => ({
        plantId: String(item.plantId),
        quantity: item.quantity,
        price: item.price,
      })),
      addresses: user.addresses ?? [],
      createdAt: toIsoString(user.createdAt),
      updatedAt: toIsoString(user.updatedAt),
    };
  }
}
