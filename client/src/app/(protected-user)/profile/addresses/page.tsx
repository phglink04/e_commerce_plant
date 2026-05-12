"use client";

import AddressList from "@/components/profile/addresses/AddressList";

export default function ProfileAddressesPage() {
  return (
    <>
      <header className="pf-main__header">
        <h1 className="pf-main__title" id="profile-page-title">
          Addresses
        </h1>
        <p className="pf-main__subtitle">
          Manage your delivery addresses
        </p>
      </header>
      <div className="pf-main__content">
        <AddressList />
      </div>
    </>
  );
}
