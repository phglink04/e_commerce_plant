"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { orderStatusLabel } from "@/lib/order-status";
import { useAuthStore } from "@/store/auth-store";

type Order = {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  items: Array<{ name: string; quantity: number }>;
};

export default function MyOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;

      try {
        const response = await api.get("/api/orders/myorders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data?.data?.orders ?? []);
      } catch {
        setError("Đã xáy ra lỗi khi tải danh sách đơn hàng.");
      }
    };

    void fetchOrders();
  }, [token]);

  return (
    <main className="container pw-account-page">
      <h1>My Orders</h1>

      {error ? <p className="error">{error}</p> : null}
      {orders.length === 0 ? <p>Chưa có đơn hàng nào.</p> : null}

      <section className="pw-orders-list">
        {orders.map((order) => (
          <article key={order.id} className="pw-order-card">
            <div className="pw-order-head">
              <h3>{order.id}</h3>
              <span className={`pw-order-status ${order.status.toLowerCase()}`}>
                {orderStatusLabel(order.status)}
              </span>
            </div>
            <p>Date: {order.createdAt}</p>
            <p>Total: {order.total} VND</p>
            <ul>
              {order.items.map((item) => (
                <li key={`${order.id}-${item.name}`}>
                  {item.name} x {item.quantity}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
