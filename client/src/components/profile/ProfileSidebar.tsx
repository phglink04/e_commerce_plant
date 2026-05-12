"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Package,
  MapPin,
  Star,
  Shield,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

const MENU_ITEMS = [
  {
    href: "/profile/info",
    label: "Profile Info",
    icon: User,
    description: "Manage your personal details",
  },
  {
    href: "/profile/orders",
    label: "My Orders",
    icon: Package,
    description: "Track and manage orders",
  },
  {
    href: "/profile/addresses",
    label: "Addresses",
    icon: MapPin,
    description: "Manage delivery addresses",
  },
  {
    href: "/profile/reviews",
    label: "My Reviews",
    icon: Star,
    description: "Your product reviews",
  },
  {
    href: "/profile/security",
    label: "Security",
    icon: Shield,
    description: "Password & 2FA settings",
  },
];

interface ProfileSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function ProfileSidebar({
  mobileOpen,
  onClose,
}: ProfileSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside
      className={`pf-sidebar ${mobileOpen ? "pf-sidebar--mobile-open" : ""}`}
      id="profile-sidebar"
    >
      {/* User card */}
      <div className="pf-sidebar__user">
        <div className="pf-sidebar__avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
          )}
        </div>
        <div className="pf-sidebar__user-info">
          <p className="pf-sidebar__name">{user?.name || "User"}</p>
          <p className="pf-sidebar__email">{user?.email || ""}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="pf-sidebar__nav" aria-label="Profile navigation">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`pf-sidebar__link ${isActive ? "pf-sidebar__link--active" : ""}`}
              id={`sidebar-${item.href.split("/").pop()}`}
              onClick={onClose}
            >
              <div className="pf-sidebar__link-icon">
                <Icon size={18} />
              </div>
              <div className="pf-sidebar__link-text">
                <span className="pf-sidebar__link-label">{item.label}</span>
                <span className="pf-sidebar__link-desc">{item.description}</span>
              </div>
              <ChevronRight size={16} className="pf-sidebar__chevron" />
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="pf-sidebar__footer">
        <button
          onClick={logout}
          className="pf-sidebar__logout"
          id="profile-logout-btn"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
