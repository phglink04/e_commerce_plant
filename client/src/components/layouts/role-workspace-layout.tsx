"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import RoleGuard from "@/components/auth/role-guard";
import type { AppRole } from "@/lib/role-routing";
import { useAuthStore } from "@/store/auth-store";
import { useHomeUiStore } from "@/store/home-ui-store";
import { normalizeImageSrc } from "@/utils/utils";
import { LayoutDashboard, Package, Users, Settings, LogOut, Truck, ChevronRight, Menu, X, User } from "lucide-react";

type MenuItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

type RoleWorkspaceLayoutProps = {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  loginPath: string;
  menus: MenuItem[];
  heading: string;
  kind: "admin" | "delivery";
};

export default function RoleWorkspaceLayout({
  children,
  allowedRoles,
  loginPath,
  menus,
  heading,
  kind,
}: RoleWorkspaceLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { logo, fetchLogo } = useHomeUiStore();

  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    void fetchLogo();
  }, [fetchLogo]);

  const isLoginPage = pathname
    ? pathname.replace(/\/$/, "").toLowerCase() === loginPath.replace(/\/$/, "").toLowerCase()
    : false;

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <RoleGuard allowedRoles={allowedRoles} loginPath={loginPath}>
      <main className="min-h-screen bg-slate-50">
        {kind === "admin" ? (
          <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="hidden border-r border-slate-200 bg-slate-900 p-6 text-white lg:flex lg:flex-col">
              <div className="mb-10 flex items-center gap-3">
                <Image
                  src={normalizeImageSrc(logo)}
                  alt="Logo"
                  width={32}
                  height={32}
                  className="rounded-lg object-contain bg-white p-1"
                />
                <span className="text-lg font-bold tracking-tight">PlantWorld</span>
              </div>

              <nav aria-label="Admin navigation" className="flex-1 space-y-1">
                {menus.map((menu) => (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      pathname === menu.href
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {menu.icon}
                    {menu.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto space-y-3">
                <div className="rounded-2xl bg-slate-800 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                      {user?.name?.charAt(0) ?? "A"}
                    </div>
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium">{user?.name ?? "Admin"}</p>
                      <p className="truncate text-xs text-slate-400">{user?.email ?? ""}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 font-medium transition duration-200"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Đăng xuất</span>
                </button>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="p-6">{children}</div>
            </section>
          </div>
        ) : (
          <div className="flex h-screen bg-slate-50">
            {/* Sidebar Toggle Button for Mobile */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-md md:hidden border border-slate-200"
              title="Menu"
            >
              {isOpen ? <X size={20} className="text-slate-700" /> : <Menu size={20} className="text-slate-700" />}
            </button>

            {/* Sidebar */}
            <aside
              className={`${
                isOpen ? "w-64" : "w-0"
              } bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-all duration-300 md:w-64 md:relative z-40 shrink-0`}
            >
              {/* Branding Header */}
              <div className="p-6 border-b border-slate-200 flex items-center gap-3">
                <Image
                  src={normalizeImageSrc(logo)}
                  alt="Logo"
                  width={32}
                  height={32}
                  className="rounded-lg object-contain"
                />
                <span className="text-lg font-bold tracking-tight text-emerald-600">🌱 Logistics</span>
              </div>

              {/* Navigation Menus */}
              <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                {menus.map((menu) => {
                  let icon = menu.icon || <Package size={18} />;
                  if (menu.href.includes("profile")) {
                    icon = <User size={18} />;
                  } else if (menu.href.includes("settings")) {
                    icon = <Settings size={18} />;
                  } else if (menu.href.includes("orders")) {
                    icon = <Truck size={18} />;
                  }
                  
                  const isActive = pathname === menu.href;
                  return (
                    <Link
                      key={menu.href}
                      href={menu.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {icon}
                      <span className="text-sm font-medium">{menu.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer with User info and Logout */}
              <div className="border-t border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                    {user?.name?.charAt(0) ?? "D"}
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-xs font-semibold text-slate-700">{user?.name ?? "Bưu tá"}</p>
                    <p className="truncate text-[10px] text-slate-400">{user?.email ?? ""}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold transition duration-200"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Đăng xuất</span>
                </button>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {/* Header / Top Bar */}
              <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-800 hidden md:block">
                    {heading === "Delivery Workspace" ? "Trung Tâm Logistics" : heading}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Trực tuyến
                  </span>
                </div>
              </header>

              {/* Page Content */}
              <main className="flex-1 overflow-y-auto px-6 py-6 min-w-0">
                {children}
              </main>
            </div>
          </div>
        )}
      </main>
    </RoleGuard>
  );
}
