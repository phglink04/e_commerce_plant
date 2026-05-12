export interface Discount {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableCategories: string[];
  applicableProducts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountPayload {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  applicableCategories?: string[];
  applicableProducts?: string[];
}

export interface UpdateDiscountPayload extends Partial<CreateDiscountPayload> {}

export interface ApplyDiscountPayload {
  code: string;
  cartTotal: number;
}

export interface ApplyDiscountResponse {
  valid: boolean;
  code: string;
  type: "percentage" | "fixed";
  discountAmount: number;
  finalTotal: number;
  message: string;
}
