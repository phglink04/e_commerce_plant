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
    image: string;
  }>;
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
