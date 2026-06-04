/**
 * API Constants
 * Định nghĩa các endpoint API và config liên quan
 */

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
    verify: "/api/auth/verify",
    forgot: "/api/auth/forgot-password",
    reset: "/api/auth/reset-password",
  },

  // Products
  products: {
    list: "/api/plants",
    create: "/api/plants",
    getById: (id: string) => `/api/plants/${id}`,
    update: (id: string) => `/api/plants/${id}`,
    delete: (id: string) => `/api/plants/${id}`,
    featured: "/api/plants/featured",
    flashSale: "/api/plants/flash-sale",
    stats: "/api/plants/stats",
  },

  // Categories
  categories: {
    list: "/api/categories",
    create: "/api/categories",
    getById: (id: string) => `/api/categories/${id}`,
    update: (id: string) => `/api/categories/${id}`,
    delete: (id: string) => `/api/categories/${id}`,
  },

  // Cart
  cart: {
    get: "/api/cart",
    add: "/api/cart/add",
    remove: "/api/cart/remove",
    update: "/api/cart/update",
    clear: "/api/cart/clear",
  },

  // Orders
  orders: {
    list: "/api/orders",
    myList: "/api/orders/myorders",
    create: "/api/orders",
    getById: (id: string) => `/api/orders/${id}`,
    myGetById: (id: string) => `/api/orders/myorders/${id}`,
    cancel: (id: string) => `/api/orders/${id}/cancel`,
    updateStatus: (id: string) => `/api/orders/${id}/status`,
  },

  // Users
  users: {
    profile: "/api/users/profile",
    update: (id: string) => `/api/users/${id}`,
    list: "/api/users",
  },

  // Payment
  payment: {
    generateQR: "/api/payment/generate-qr",
    checkPayment: "/api/payment/check-payment",
    checkByOrder: (id: string) => `/api/payment/check/${id}`,
  },

  // Blogs
  blogs: {
    list: "/api/blogs",
    create: "/api/blogs",
    getById: (id: string) => `/api/blogs/${id}`,
    update: (id: string) => `/api/blogs/${id}`,
    delete: (id: string) => `/api/blogs/${id}`,
    published: "/api/blogs/published",
    featured: "/api/blogs/featured",
    bySlug: (slug: string) => `/api/blogs/slug/${slug}`,
  },

  // Discounts
  discounts: {
    list: "/api/discounts",
    create: "/api/discounts",
    visible: "/api/discounts/visible",
    getById: (id: string) => `/api/discounts/${id}`,
    update: (id: string) => `/api/discounts/${id}`,
    delete: (id: string) => `/api/discounts/${id}`,
    apply: "/api/discounts/apply",
  },

  // Reviews
  reviews: {
    list: "/api/reviews",
    create: "/api/reviews",
    summary: "/api/reviews/summary",
    canReview: "/api/reviews/can-review",
    pending: "/api/reviews/pending",
    like: (id: string) => `/api/reviews/${id}/like`,
    reply: (id: string) => `/api/reviews/${id}/reply`,
    myReviews: "/api/reviews/my-reviews",
    update: (id: string) => `/api/reviews/${id}`,
    delete: (id: string) => `/api/reviews/${id}`,
    uploadImage: "/api/reviews/upload-image",
    // Admin
    adminList: "/api/reviews/admin",
    adminApprove: (id: string) => `/api/reviews/admin/${id}/approve`,
    adminReject: (id: string) => `/api/reviews/admin/${id}/reject`,
    adminDelete: (id: string) => `/api/reviews/admin/${id}`,
  },

  // Addresses
  addresses: {
    myAddresses: "/api/addresses/my",
    create: "/api/addresses",
    update: (id: string) => `/api/addresses/${id}`,
    delete: (id: string) => `/api/addresses/${id}`,
  },

  // Profile / Security
  profile: {
    me: "/api/users/me",
    updateMe: "/api/users/updateMe",
    updateAvatar: "/api/users/update-avatar",
    changePassword: "/api/users/updateMyPassword",
  },

  // 2FA
  twoFactor: {
    setup: "/api/auth/2fa/setup",
    verify: "/api/auth/2fa/verify",
    disable: "/api/auth/2fa/disable",
    status: "/api/auth/2fa/status",
  },
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
};

// Product constants
export const PRODUCT_TAG = {
  INDOOR: "Indoor",
  OUTDOOR: "Outdoor",
} as const;

export const PRODUCT_AVAILABILITY = {
  IN_STOCK: "In Stock",
  OUT_OF_STOCK: "Out Of Stock",
} as const;

// API configuration
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};
