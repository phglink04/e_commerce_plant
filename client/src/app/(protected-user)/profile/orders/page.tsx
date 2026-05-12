"use client";

import OrderList from "@/components/profile/orders/OrderList";

export default function ProfileOrdersPage() {
  return (
    <>
      <header className="pf-main__header">
        <h1 className="pf-main__title" id="profile-page-title">
          My Orders
        </h1>
        <p className="pf-main__subtitle">
          Track and manage your order history
        </p>
      </header>
      <div className="pf-main__content">
        <OrderList />
      </div>
    </>
  );
}
