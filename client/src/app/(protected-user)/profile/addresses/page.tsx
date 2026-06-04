"use client";

import AddressList from "@/components/profile/addresses/AddressList";

export default function ProfileAddressesPage() {
  return (
    <>
      <header className="pf-main__header">
        <h1 className="pf-main__title" id="profile-page-title">
          Sổ địa chỉ
        </h1>
        <p className="pf-main__subtitle">
          Quản lý các địa chỉ nhận hàng của bạn
        </p>
      </header>
      <div className="pf-main__content">
        <AddressList />
      </div>
    </>
  );
}
