"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { User, Package, MapPin, Star, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

const QUICK_LINKS = [
  {
    href: "/profile/info",
    label: "Thông tin cá nhân",
    desc: "Xem và chỉnh sửa thông tin cá nhân của bạn",
    icon: User,
    color: "#059669",
    bg: "#d1fae5",
  },
  {
    href: "/profile/orders",
    label: "Đơn hàng của tôi",
    desc: "Theo dõi lịch sử và trạng thái đơn hàng",
    icon: Package,
    color: "#2563eb",
    bg: "#dbeafe",
  },
  {
    href: "/profile/addresses",
    label: "Sổ địa chỉ",
    desc: "Quản lý địa chỉ nhận hàng của bạn",
    icon: MapPin,
    color: "#d97706",
    bg: "#fef3c7",
  },
  {
    href: "/profile/reviews",
    label: "Đánh giá của tôi",
    desc: "Xem và quản lý các đánh giá sản phẩm của bạn",
    icon: Star,
    color: "#7c3aed",
    bg: "#ede9fe",
  },
  {
    href: "/profile/security",
    label: "Bảo mật tài khoản",
    desc: "Mật khẩu, xác thực 2 lớp và cài đặt đăng nhập",
    icon: Shield,
    color: "#dc2626",
    bg: "#fee2e2",
  },
];

export default function ProfileOverviewPage() {
  const { user } = useAuthStore();

  return (
    <>
      <header className="pf-main__header">
        <h1 className="pf-main__title" id="profile-page-title">
          Chào mừng trở lại, {user?.name || "Khách hàng"}
        </h1>
        <p className="pf-main__subtitle">
          Quản lý các cài đặt tài khoản và tùy chọn cá nhân của bạn
        </p>
      </header>

      <div className="pf-main__content">
        <div className="pf-overview-grid">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="pf-overview-card"
                id={`overview-${link.href.split("/").pop()}`}
              >
                <div
                  className="pf-overview-card__icon"
                  style={{ background: link.bg, color: link.color }}
                >
                  <Icon size={24} />
                </div>
                <div className="pf-overview-card__text">
                  <h3>{link.label}</h3>
                  <p>{link.desc}</p>
                </div>
                <ArrowRight
                  size={18}
                  className="pf-overview-card__arrow"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
