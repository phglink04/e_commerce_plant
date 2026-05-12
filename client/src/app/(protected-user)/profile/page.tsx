"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { User, Package, MapPin, Star, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

const QUICK_LINKS = [
  {
    href: "/profile/info",
    label: "Profile Info",
    desc: "View and edit your personal details",
    icon: User,
    color: "#059669",
    bg: "#d1fae5",
  },
  {
    href: "/profile/orders",
    label: "My Orders",
    desc: "Track your order history and status",
    icon: Package,
    color: "#2563eb",
    bg: "#dbeafe",
  },
  {
    href: "/profile/addresses",
    label: "Addresses",
    desc: "Manage your delivery addresses",
    icon: MapPin,
    color: "#d97706",
    bg: "#fef3c7",
  },
  {
    href: "/profile/reviews",
    label: "My Reviews",
    desc: "View and manage your product reviews",
    icon: Star,
    color: "#7c3aed",
    bg: "#ede9fe",
  },
  {
    href: "/profile/security",
    label: "Security",
    desc: "Password, 2FA, and login settings",
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
          Welcome back, {user?.name?.split(" ")[0] || "User"}
        </h1>
        <p className="pf-main__subtitle">
          Manage your account settings and preferences
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
