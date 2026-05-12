"use client";

import ProfileSidebar from "./ProfileSidebar";

interface ProfileLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function ProfileLayout({
  children,
  title,
  subtitle,
}: ProfileLayoutProps) {
  return (
    <div className="pf-shell">
      <ProfileSidebar />
      <main className="pf-main">
        <header className="pf-main__header">
          <h1 className="pf-main__title" id="profile-page-title">{title}</h1>
          {subtitle && (
            <p className="pf-main__subtitle">{subtitle}</p>
          )}
        </header>
        <div className="pf-main__content">{children}</div>
      </main>
    </div>
  );
}
