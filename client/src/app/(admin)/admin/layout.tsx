import RoleWorkspaceLayout from "@/components/layouts/role-workspace-layout";
import {
  LayoutDashboard,
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Settings,
  BookOpen,
  Tag,
  Star,
  MessageSquare,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menus = [
    { href: "/admin", label: "Tổng quan", icon: <LayoutDashboard size={18} /> },
    { href: "/admin/analytics", label: "Thống kê", icon: <BarChart3 size={18} /> },
    { href: "/admin/plants", label: "Sản phẩm", icon: <Package size={18} /> },
    { href: "/admin/orders", label: "Đơn hàng", icon: <ShoppingCart size={18} /> },
    { href: "/admin/users", label: "Người dùng", icon: <Users size={18} /> },
    { href: "/admin/deliveryPartner", label: "Đối tác giao hàng", icon: <Truck size={18} /> },
    { href: "/admin/home-settings", label: "Cài đặt trang chủ", icon: <Settings size={18} /> },
    { href: "/admin/blogs", label: "Blog", icon: <BookOpen size={18} /> },
    { href: "/admin/discounts", label: "Khuyến mãi", icon: <Tag size={18} /> },
    { href: "/admin/reviews", label: "Đánh giá", icon: <Star size={18} /> },
    { href: "/admin/chat", label: "Chat Support", icon: <MessageSquare size={18} /> }
  ];

  return (
    <RoleWorkspaceLayout
      allowedRoles={["admin"]}
      loginPath="/admin/login"
      menus={menus}
      heading="Admin Panel"
      kind="admin"
    >
      {children}
    </RoleWorkspaceLayout>
  );
}

