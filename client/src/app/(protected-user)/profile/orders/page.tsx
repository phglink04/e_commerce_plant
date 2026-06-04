"use client";

import OrderList from "@/components/profile/orders/OrderList";

export default function ProfileOrdersPage() {
  return (
    <>
      <header className="pf-main__header">
        <h1 className="pf-main__title" id="profile-page-title">
          Đơn hàng của tôi
        </h1>
        <p className="pf-main__subtitle">
          Theo dõi và quản lý lịch sử đơn hàng của bạn
        </p>
      </header>
      <div className="pf-main__content">
        <OrderList />
      </div>
    </>
  );
}
