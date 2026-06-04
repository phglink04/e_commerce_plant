"use client";

import ProfileForm from "@/components/profile/info/ProfileForm";

export default function ProfileInfoPage() {
  return (
    <>
      <header className="pf-main__header">
        <h1 className="pf-main__title" id="profile-page-title">
          Thông tin cá nhân
        </h1>
        <p className="pf-main__subtitle">
          Quản lý thông tin cá nhân và ảnh đại diện của bạn
        </p>
      </header>
      <div className="pf-main__content">
        <ProfileForm />
      </div>
    </>
  );
}
