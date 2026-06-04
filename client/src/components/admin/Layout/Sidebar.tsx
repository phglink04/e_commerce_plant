"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
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
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`${
          isOpen ? "w-64" : "w-0"
        } bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-all duration-300 md:w-64 md:relative`}
      >
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-emerald-600">🌱 Admin</h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <div key={item.href}>
              <button
                onClick={() =>
                  setExpandedMenu(expandedMenu === item.href ? null : item.href)
                }
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  pathname === item.href
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <item.icon size={20} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.submenu && (
                  <ChevronDown
                    size={16}
                    className={`transition ${
                      expandedMenu === item.href ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {item.submenu && expandedMenu === item.href && (
                <div className="ml-4 mt-2 space-y-1">
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
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold transition duration-200"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
          <p className="text-xs text-slate-400 text-center font-medium">
            PlantWorld v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}
