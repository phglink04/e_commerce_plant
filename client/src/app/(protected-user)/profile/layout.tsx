"use client";

import { useState } from "react";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import { Menu, X } from "lucide-react";

export default function ProfileLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="pf-shell">
      {/* Mobile Header */}
      <div className="pf-mobile-header">
        <button
          className="pf-mobile-header__toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle profile menu"
          id="profile-mobile-toggle"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          <span>Profile Menu</span>
        </button>
      </div>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="pf-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <ProfileSidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="pf-main">{children}</main>
    </div>
  );
}
