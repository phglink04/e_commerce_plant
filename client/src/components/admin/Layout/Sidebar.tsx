"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
    submenu: [
      { label: "All Products", href: "/admin/products" },
      { label: "Categories", href: "/admin/categories" },
    ],
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    submenu: [
      { label: "All Orders", href: "/admin/orders" },
      { label: "Returns", href: "/admin/orders/returns" },
    ],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Comments",
    href: "/admin/comments",
    icon: MessageSquare,
  },
  {
    label: "Delivery",
    href: "/admin/delivery",
    icon: Truck,
  },
  {
    label: "Blogs",
    href: "/admin/blogs",
    icon: BookOpen,
  },
  {
    label: "Home",
    href: "/admin/home-settings",
    icon: Home,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

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

        <div className="border-t border-slate-200 p-4">
          <p className="text-xs text-slate-500 text-center">
            PlantWorld v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}
