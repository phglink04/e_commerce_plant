"use client";

import { use } from "react";
import OrderDetail from "@/components/profile/orders/OrderDetail";

export default function ProfileOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <>
      <div className="pf-main__content">
        <OrderDetail orderId={id} />
      </div>
    </>
  );
}
