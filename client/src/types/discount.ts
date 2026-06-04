export interface Discount {
  id: string;
  name: string;
  code: string;
  percentage: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountPayload {
  name: string;
  percentage: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  isVisible?: boolean;
}

export interface UpdateDiscountPayload extends Partial<CreateDiscountPayload> {}

export interface ApplyDiscountPayload {
  code: string;
  cartTotal: number;
}

export interface ApplyDiscountResponse {
  valid: boolean;
  code: string;
  percentage: number;
  discountAmount: number;
  finalTotal: number;
  message: string;
}
