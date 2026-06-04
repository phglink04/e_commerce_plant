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
import { normalizeImageSrc } from "@/utils/utils";

const MENU_ITEMS = [
  {
    href: "/profile/info",
    label: "Thông tin cá nhân",
    icon: User,
    description: "Quản lý thông tin cá nhân",
  },
  {
    href: "/profile/orders",
    label: "Đơn hàng",
    icon: Package,
    description: "Theo dõi và quản lý đơn hàng",
  },
  {
    href: "/profile/addresses",
    label: "Địa chỉ",
    icon: MapPin,
    description: "Quản lý địa chỉ giao hàng",
  },
  {
    href: "/profile/reviews",
    label: "Đánh giá",
    icon: Star,
    description: "Đánh giá sản phẩm của bạn",
  },
  {
    href: "/profile/security",
    label: "Bảo mật",
    icon: Shield,
    description: "Mật khẩu & xác thực 2 lớp",
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
            <img src={normalizeImageSrc(user.avatar)} alt={user.name} />
          ) : (
            <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
          )}
        </div>
        <div className="pf-sidebar__user-info">
          <p className="pf-sidebar__name">{user?.name || "Người dùng"}</p>
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
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
