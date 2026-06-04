import api from "@/lib/api";
import type { UiOrderStatus } from "@/lib/order-status";

export type AdminPlant = {
  _id: string;
  name: string;
  imageCover: string;
  category: string;
  price: number;
  availability: "In Stock" | "Out Of Stock" | "Discontinued";
  tag: "Indoor" | "Outdoor";
  tags: string[];
  description?: string;
};

export type PlantUpsertPayload = Omit<AdminPlant, "_id"> & {
  imageFile?: File | null;
  stock?: number;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  discountPercentage?: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "owner" | "deliverypartner";
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminOrderStatus = UiOrderStatus;

export type AdminOrder = {
  id: string;
  userId: string;
  orderStatus: AdminOrderStatus;
  paymentStatus: string;
  total: number;
  shippingAddress: string;
  shippingFee?: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    plantId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryPartnerId?: string | null;
  deliveryPartnerName?: string | null;
  returnReason?: string | null;
};

export type PagedResult<T> = {
  items: T[];
  totalResults: number;
  totalPages: number;
  page: number;
  limit: number;
};

const withAuth = (token?: string | null) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

export async function getPlants(query: {
  page: number;
  limit: number;
  search?: string;
}) {
  const response = await api.get("/api/plants", {
    params: {
      page: query.page,
      limit: query.limit,
      search: query.search?.trim() || undefined,
    },
  });

  return {
    items: (response.data?.data?.plants ?? []) as AdminPlant[],
    totalResults: Number(response.data?.totalResults ?? 0),
    totalPages: Number(response.data?.totalPages ?? 1),
    page: Number(response.data?.page ?? query.page),
  };
}

export async function createPlant(
  payload: PlantUpsertPayload, // Đảm bảo type này đã có stock, isFeatured, isFlashSale
  token?: string | null,
) {
  if (payload.imageFile) {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("category", payload.category);
    formData.append("price", String(payload.price));
    formData.append("availability", payload.availability);
    formData.append("tag", payload.tag);
    if (payload.tags) {
      payload.tags.forEach((t) => formData.append("tags[]", t));
    }

    // === 1. THÊM CÁC TRƯỜNG MỚI VÀO ĐÂY ===
    formData.append("stock", String(payload.stock ?? 0));
    formData.append("isFeatured", String(payload.isFeatured ?? false));
    formData.append("isFlashSale", String(payload.isFlashSale ?? false));
    formData.append(
      "discountPercentage",
      String(payload.discountPercentage ?? 0),
    );

    if (payload.description?.trim()) {
      formData.append("description", payload.description.trim());
    }

    if (payload.imageCover?.trim()) {
      formData.append("imageCover", payload.imageCover.trim());
    }

    formData.append("image", payload.imageFile);

    const response = await api.post("/api/plants", formData, {
      ...withAuth(token),
      headers: {
        ...(withAuth(token).headers ?? {}),
      },
    });
    return response.data?.data?.plant as AdminPlant | undefined;
  }

  const { imageFile: _unusedImageFile, ...jsonPayload } = payload;
  const response = await api.post("/api/plants", jsonPayload, withAuth(token));
  return response.data?.data?.plant as AdminPlant | undefined;
}

export async function updatePlant(
  plantId: string,
  payload: PlantUpsertPayload,
  token?: string | null,
) {
  if (payload.imageFile) {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("category", payload.category);
    formData.append("price", String(payload.price));
    formData.append("availability", payload.availability);
    formData.append("tag", payload.tag);
    if (payload.tags) {
      payload.tags.forEach((t) => formData.append("tags[]", t));
    }

    // === 1. THÊM CÁC TRƯỜNG MỚI VÀO ĐÂY ===
    formData.append("stock", String(payload.stock ?? 0));
    formData.append("isFeatured", String(payload.isFeatured ?? false));
    formData.append("isFlashSale", String(payload.isFlashSale ?? false));
    formData.append(
      "discountPercentage",
      String(payload.discountPercentage ?? 0),
    );

    if (payload.description?.trim()) {
      formData.append("description", payload.description.trim());
    }

    if (payload.imageCover?.trim()) {
      formData.append("imageCover", payload.imageCover.trim());
    }

    formData.append("image", payload.imageFile);

    const response = await api.patch(`/api/plants/${plantId}`, formData, {
      ...withAuth(token),
      headers: {
        ...(withAuth(token).headers ?? {}),
      },
    });
    return response.data?.data?.plant as AdminPlant | undefined;
  }

  // TRƯỜNG HỢP KHÔNG CÓ FILE ẢNH (Gửi JSON)
  const { imageFile: _unusedImageFile, ...jsonPayload } = payload;
  const response = await api.patch(
    `/api/plants/${plantId}`,
    jsonPayload,
    withAuth(token),
  );
  return response.data?.data?.plant as AdminPlant | undefined;
}

export async function deletePlant(plantId: string, token?: string | null) {
  await api.delete(`/api/plants/${plantId}`, withAuth(token));
}

export async function getUsers(
  query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  },
  token?: string | null,
): Promise<PagedResult<AdminUser>> {
  const response = await api.get("/api/users", {
    ...withAuth(token),
    params: {
      page: query.page,
      limit: query.limit,
      search: query.search?.trim() || undefined,
      role: query.role?.trim() || undefined,
    },
  });

  return {
    items: (response.data?.data?.users ?? []) as AdminUser[],
    totalResults: Number(response.data?.totalResults ?? 0),
    totalPages: Number(response.data?.totalPages ?? 1),
    page: Number(response.data?.page ?? query.page ?? 1),
    limit: Number(response.data?.limit ?? query.limit ?? 10),
  };
}

export async function getUserById(userId: string, token?: string | null) {
  const response = await api.get(`/api/users/${userId}`, withAuth(token));
  return response.data?.data?.user as AdminUser | undefined;
}

export async function updateUser(
  userId: string,
  payload: Partial<Pick<AdminUser, "name" | "phone" | "role" | "isActive">>,
  token?: string | null,
) {
  const response = await api.patch(
    `/api/users/${userId}`,
    payload,
    withAuth(token),
  );
  return response.data?.data?.user as AdminUser | undefined;
}

export async function deleteUser(userId: string, token?: string | null) {
  await api.delete(`/api/users/${userId}`, withAuth(token));
}

export async function createDeliveryPartner(
  payload: { name: string; email: string; password: string; phone?: string },
  token?: string | null,
) {
  const response = await api.post(
    "/api/users/add-delivery-partner",
    payload,
    withAuth(token),
  );

  return response.data?.data?.user as AdminUser | undefined;
}

export async function getOrders(
  query: {
    page?: number;
    limit?: number;
    search?: string;
    orderStatus?: string;
    deliveryPartnerId?: string;
    userId?: string;
  },
  token?: string | null,
): Promise<PagedResult<AdminOrder>> {
  const response = await api.get("/api/orders", {
    ...withAuth(token),
    params: {
      page: query.page,
      limit: query.limit,
      search: query.search?.trim() || undefined,
      orderStatus: query.orderStatus?.trim() || undefined,
      deliveryPartnerId: query.deliveryPartnerId?.trim() || undefined,
      userId: query.userId?.trim() || undefined,
    },
  });

  return {
    items: (response.data?.data?.orders ?? []) as AdminOrder[],
    totalResults: Number(response.data?.totalResults ?? 0),
    totalPages: Number(response.data?.totalPages ?? 1),
    page: Number(response.data?.page ?? query.page ?? 1),
    limit: Number(response.data?.limit ?? query.limit ?? 10),
  };
}

export async function updateOrderStatus(
  orderId: string,
  orderStatus: AdminOrderStatus,
  paymentStatus?: string,
  token?: string | null,
  deliveryPartnerId?: string,
  deliveryPartnerName?: string,
  returnReason?: string,
) {
  const payload: any = { orderStatus };
  if (paymentStatus) {
    payload.paymentStatus = paymentStatus;
  }
  if (deliveryPartnerId) {
    payload.deliveryPartnerId = deliveryPartnerId;
  }
  if (deliveryPartnerName) {
    payload.deliveryPartnerName = deliveryPartnerName;
  }
  if (returnReason) {
    payload.returnReason = returnReason;
  }
  const response = await api.patch(
    `/api/orders/${orderId}/status`,
    payload,
    withAuth(token),
  );
  return response.data?.data?.order as AdminOrder | undefined;
}
