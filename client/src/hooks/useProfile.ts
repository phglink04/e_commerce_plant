/**
 * useProfile - Profile Data Management Hook
 * Centralized hook for all profile-related data fetching & mutations
 */

import { useState, useCallback } from "react";
import { useFetch } from "./useFetch";
import { profileService } from "@/services/profile.service";
import { addressService } from "@/services/address.service";
import { orderService } from "@/services/order.service";
import { reviewService } from "@/services/review.service";
import { API_ENDPOINTS } from "@/constants";
import { BaseApiService } from "@/services/base-api.service";
import type {
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
  Address,
  CreateAddressPayload,
  UpdateAddressPayload,
  Order,
  Review,
  PaginatedResponse,
  ApiError,
} from "@/types";

// ─── Profile Info ──────────────────────────────────────────

export function useProfileInfo() {
  const {
    data: profile,
    loading,
    error,
    refetch,
  } = useFetch<UserProfile>(() => profileService.getMe(), []);

  const [updating, setUpdating] = useState(false);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      setUpdating(true);
      try {
        const updated = await profileService.updateMe(payload);
        await refetch();
        return updated;
      } finally {
        setUpdating(false);
      }
    },
    [refetch],
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      setUpdating(true);
      try {
        const updated = await profileService.updateAvatar(file);
        await refetch();
        return updated;
      } finally {
        setUpdating(false);
      }
    },
    [refetch],
  );

  return {
    profile,
    loading,
    error,
    updating,
    updateProfile,
    uploadAvatar,
    refetch,
  };
}

// ─── Addresses ─────────────────────────────────────────────

export function useAddresses() {
  const {
    data: addresses,
    loading,
    error,
    refetch,
  } = useFetch<Address[]>(() => addressService.getMyAddresses(), []);

  const [submitting, setSubmitting] = useState(false);

  const createAddress = useCallback(
    async (payload: CreateAddressPayload) => {
      setSubmitting(true);
      try {
        const created = await addressService.createAddress(payload);
        await refetch();
        return created;
      } finally {
        setSubmitting(false);
      }
    },
    [refetch],
  );

  const updateAddress = useCallback(
    async (id: string, payload: UpdateAddressPayload) => {
      setSubmitting(true);
      try {
        const updated = await addressService.updateAddress(id, payload);
        await refetch();
        return updated;
      } finally {
        setSubmitting(false);
      }
    },
    [refetch],
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      setSubmitting(true);
      try {
        await addressService.deleteAddress(id);
        await refetch();
      } finally {
        setSubmitting(false);
      }
    },
    [refetch],
  );

  return {
    addresses: addresses || [],
    loading,
    error,
    submitting,
    createAddress,
    updateAddress,
    deleteAddress,
    refetch,
  };
}

// ─── My Orders ─────────────────────────────────────────────

export function useMyOrders(status?: string) {
  const {
    data: ordersData,
    loading,
    error,
    refetch,
  } = useFetch<Order[]>(
    () => orderService.getMyOrders(),
    [status],
  );

  // Client-side status filtering
  const filteredOrders = status
    ? (ordersData || []).filter((o) => o.orderStatus === status)
    : ordersData || [];

  return {
    orders: filteredOrders,
    allOrders: ordersData || [],
    loading,
    error,
    refetch,
  };
}

export function useOrderDetail(orderId: string) {
  const {
    data: order,
    loading,
    error,
    refetch,
  } = useFetch<Order>(() => orderService.getMyOrderById(orderId), [orderId], {
    skip: !orderId,
  });

  const [cancelling, setCancelling] = useState(false);

  const cancelOrder = useCallback(async () => {
    if (!orderId) return;
    setCancelling(true);
    try {
      await orderService.cancelOrder(orderId);
      await refetch();
    } finally {
      setCancelling(false);
    }
  }, [orderId, refetch]);

  return { order, loading, error, cancelling, cancelOrder, refetch };
}

// ─── My Reviews ────────────────────────────────────────────

class MyReviewService extends BaseApiService {
  async getMyReviews(page = 1, limit = 10) {
    const response = await this.get<{ reviews: Review[] }>(
      API_ENDPOINTS.reviews.myReviews,
      { params: { page, limit } },
    );
    return {
      items: response.data?.reviews || [],
      totalResults: response.totalResults || 0,
      totalPages: response.totalPages || 1,
      page: response.page || page,
      limit,
    } as PaginatedResponse<Review>;
  }

  async deleteReview(id: string) {
    await this.delete(API_ENDPOINTS.reviews.delete(id));
  }

  async updateReview(
    id: string,
    payload: { rating?: number; content?: string },
  ) {
    const response = await this.patch<{ review: Review }>(
      API_ENDPOINTS.reviews.update(id),
      payload,
    );
    return response.data.review;
  }
}

const myReviewService = new MyReviewService();

export function useMyReviews() {
  const {
    data: reviewsData,
    loading,
    error,
    refetch,
  } = useFetch<PaginatedResponse<Review>>(
    () => myReviewService.getMyReviews(1, 50),
    [],
  );

  const [submitting, setSubmitting] = useState(false);

  const deleteReview = useCallback(
    async (id: string) => {
      setSubmitting(true);
      try {
        await myReviewService.deleteReview(id);
        await refetch();
      } finally {
        setSubmitting(false);
      }
    },
    [refetch],
  );

  const updateReview = useCallback(
    async (id: string, payload: { rating?: number; content?: string }) => {
      setSubmitting(true);
      try {
        const updated = await myReviewService.updateReview(id, payload);
        await refetch();
        return updated;
      } finally {
        setSubmitting(false);
      }
    },
    [refetch],
  );

  return {
    reviews: reviewsData?.items || [],
    loading,
    error,
    submitting,
    deleteReview,
    updateReview,
    refetch,
  };
}

// ─── Security ──────────────────────────────────────────────

export function useSecurity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState("");

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    setLoading(true);
    setError(null);
    setSuccess("");
    try {
      await profileService.changePassword(payload);
      setSuccess("Password changed successfully");
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, changePassword, setError, setSuccess };
}
