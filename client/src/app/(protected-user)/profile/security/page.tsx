"use client";

import ChangePasswordForm from "@/components/profile/security/ChangePasswordForm";
import TwoFactorSettings from "@/components/profile/security/TwoFactorSettings";

export default function ProfileSecurityPage() {
  return (
    <>
      <header className="pf-main__header">
        <h1 className="pf-main__title" id="profile-page-title">
          Security
        </h1>
        <p className="pf-main__subtitle">
          Manage your password and two-factor authentication
        </p>
      </header>
      <div className="pf-main__content">
        <div className="pf-security-sections">
          <ChangePasswordForm />
          <TwoFactorSettings />
        </div>
      </div>
    </>
  );
}
