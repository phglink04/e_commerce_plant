"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ORDER_STATUS_OPTIONS, orderStatusLabel } from "@/lib/order-status";
import { useAuthStore } from "@/store/auth-store";

type Order = {
  id: string;
  userId: string;
  shippingAddress: string;
  status: string;
};

const DELIVERY_STATUSES = ORDER_STATUS_OPTIONS.map((item) => item.value);

export default function DeliveryPartnerOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;

      try {
        const response = await api.get("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders((response.data?.data?.orders ?? []) as Order[]);
      } catch {
        setError("Unable to load delivery orders.");
      }
    };

    void fetchOrders();
  }, [token]);

  const updateStatus = async (orderId: string, status: string) => {
    if (!token) {
      setError("Please login first.");
      return;
    }

    setError("");
    setUpdatingId(orderId);

    try {
      await api.patch(
        `/api/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
    } catch {
      setError("Unable to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section>
      <h1>Delivery Orders</h1>
      {error ? <p className="error">{error}</p> : null}
      <table className="pw-admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Address</th>
            <th>Status</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.userId}</td>
              <td>{order.shippingAddress}</td>
              <td>{orderStatusLabel(order.status)}</td>
              <td>
                <select
                  aria-label={`Update status for order ${order.id}`}
                  title={`Update status for order ${order.id}`}
                  value={order.status}
                  onChange={(event) =>
                    void updateStatus(order.id, event.target.value)
                  }
                  disabled={updatingId === order.id}
                >
                  {DELIVERY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {orderStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
