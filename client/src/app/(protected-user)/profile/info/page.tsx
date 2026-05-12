"use client";

import ProfileForm from "@/components/profile/info/ProfileForm";

export default function ProfileInfoPage() {
  return (
    <>
      <header className="pf-main__header">
        <h1 className="pf-main__title" id="profile-page-title">
          Profile Info
        </h1>
        <p className="pf-main__subtitle">
          Manage your personal information and avatar
        </p>
      </header>
      <div className="pf-main__content">
        <ProfileForm />
      </div>
    </>
  );
}
