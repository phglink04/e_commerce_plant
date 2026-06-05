"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useHomeUiStore } from "@/store/home-ui-store";
import { normalizeImageSrc } from "@/utils/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  Truck,
  BookOpen,
  Home,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    label: "Bảng điều khiển",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Sản phẩm",
    href: "/admin/products",
    icon: Package,
    submenu: [
      { label: "Tất cả sản phẩm", href: "/admin/products" },
      { label: "Danh mục", href: "/admin/categories" },
    ],
  },
  {
    label: "Đơn hàng",
    href: "/admin/orders",
    icon: ShoppingCart,
    submenu: [
      { label: "Tất cả đơn hàng", href: "/admin/orders" },
      { label: "Hoàn trả", href: "/admin/orders/returns" },
    ],
  },
  {
    label: "Người dùng",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Bình luận",
    href: "/admin/comments",
    icon: MessageSquare,
  },
  {
    label: "Giao hàng",
    href: "/admin/delivery",
    icon: Truck,
  },
  {
    label: "Bài viết",
    href: "/admin/blogs",
    icon: BookOpen,
  },
  {
    label: "Trang chủ",
    href: "/admin/home-settings",
    icon: Home,
  },
  {
    label: "Cài đặt",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const { logo, fetchLogo } = useHomeUiStore();
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  useEffect(() => {
    void fetchLogo();
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, [fetchLogo]);

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem("admin-sidebar-collapsed", String(nextVal));
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-lg border border-slate-200 shadow-sm"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`${
          isOpen ? "w-64" : "w-0"
        } bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } md:relative h-full shrink-0`}
      >
        <div className={`p-4 border-b border-slate-200 flex items-center justify-between transition-all duration-300 ${isCollapsed ? "flex-col gap-3 p-3" : "gap-3"}`}>
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src={normalizeImageSrc(logo)}
              alt="Logo"
              width={32}
              height={32}
              className="rounded-lg object-contain shrink-0"
            />
            {!isCollapsed && <h1 className="text-xl font-bold text-emerald-600 truncate">Admin</h1>}
          </div>
          <button
            onClick={toggleCollapse}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition shrink-0"
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.submenu && item.submenu.some(sub => pathname === sub.href));
            const isSubMenuExpanded = expandedMenu === item.href && !isCollapsed;

            const content = (
              <div
                className={`w-full flex items-center ${isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"} rounded-lg transition duration-200 ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                {!isCollapsed && <span className="flex-1 text-left text-sm truncate">{item.label}</span>}
                {!isCollapsed && item.submenu && (
                  <ChevronDown
                    size={16}
                    className={`transition duration-200 ${
                      isSubMenuExpanded ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>
            );

            if (item.submenu) {
              return (
                <div key={item.href} className="w-full">
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                        localStorage.setItem("admin-sidebar-collapsed", "false");
                      }
                      setExpandedMenu(expandedMenu === item.href ? null : item.href);
                    }}
                    className="w-full block"
                  >
                    {content}
                  </button>

                  {isSubMenuExpanded && (
                    <div className="ml-4 mt-2 space-y-1 transition-all duration-300">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className={`block px-4 py-2 rounded text-sm transition ${
                            pathname === subitem.href
                              ? "bg-emerald-100 text-emerald-700 font-semibold"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href} className="block w-full">
                {content}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 space-y-3">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-4 py-2.5"} rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold transition duration-200`}
            title={isCollapsed ? "Đăng xuất" : undefined}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
          {!isCollapsed && (
            <p className="text-xs text-slate-400 text-center font-medium">
              PlantWorld v1.0.0
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
