"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RoleGuard from "@/components/auth/role-guard";
import type { AppRole } from "@/lib/role-routing";
import { useAuthStore } from "@/store/auth-store";
import { LayoutDashboard, Package, Users, Settings, LogOut, Truck, ChevronRight } from "lucide-react";
import { TopBar } from "@/components/admin/Layout/TopBar";

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

  if (pathname === loginPath) {
    return <>{children}</>;
  }

  return (
    <RoleGuard allowedRoles={allowedRoles} loginPath={loginPath}>
      <main className="min-h-screen bg-slate-50">
        {kind === "admin" ? (
          <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="hidden border-r border-slate-200 bg-slate-900 p-6 text-white lg:flex lg:flex-col">
              <div className="mb-10 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                  <span className="font-bold text-white">P</span>
                </div>
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

              <div className="mt-auto rounded-2xl bg-slate-800 p-4">
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
            </aside>

            <section className="min-w-0">
              <TopBar />
              <div className="p-6">{children}</div>
            </section>
          </div>
        ) : (
          <section className="mx-auto max-w-6xl p-4 md:p-6">
            <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
                <p className="text-sm text-slate-500">Delivery Operations Dashboard</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </header>
            <div>{children}</div>
          </section>
        )}
      </main>
    </RoleGuard>
  );
}
