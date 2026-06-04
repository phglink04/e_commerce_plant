// Dashboard
export interface DashboardStats {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    delivered: number;
    cancelled: number;
  };
  products: {
    total: number;
    outOfStock: number;
    featured: number;
  };
  users: {
    total: number;
    newThisMonth: number;
    active: number;
  };
}

export interface RevenueChartData {
  _id: string;
  revenue: number;
  count: number;
}

export interface OrderStatusChartData {
  _id: string;
  count: number;
}

export interface TopProduct {
  _id: string;
  totalSold: number;
  revenue: number;
  product: Array<{
    _id: string;
    name: string;
    price: number;
    imageCover: string;
    category: string;
  }>;
}

export interface LowStockProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  imageCover: string;
  category: string;
  availability: string;
}

export interface RecentOrder {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  totalAmount: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: Date;
  items: Array<{
    plantId: string;
    quantity: number;
    price: number;
  }>;
}

// ─── Analytics Types ───────────────────────────────────

export interface AnalyticsStats {
  revenue: number;
  paidOrders: number;
  totalOrders: number;
  newCustomers: number;
}

export interface ReviewStats {
  total: number;
  pending: number;
  avgRating: number;
  distribution: { rating: number; count: number }[];
  recent: {
    _id: string;
    rating: number;
    content: string;
    userName: string;
    isApproved: boolean;
    productName: string;
    createdAt: string;
  }[];
}

export interface RecentCustomer {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

