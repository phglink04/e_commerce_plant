import RoleWorkspaceLayout from "@/components/layouts/role-workspace-layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menus = [
    { href: "/admin", label: "Thống kê" },
    { href: "/admin/plants", label: "Sản phẩm" },
    { href: "/admin/orders", label: "Đơn hàng" },
    { href: "/admin/users", label: "Người dùng" },
    { href: "/admin/deliveryPartner", label: "Đối tác giao hàng" },
    { href: "/admin/home-settings", label: "Cài đặt trang chủ" },
    { href: "/admin/blogs", label: "Blog" },
    { href: "/admin/discounts", label: "Khuyến mãi" },
    { href: "/admin/reviews", label: "Đánh giá" },
    { href: "/admin/chat", label: "Chat Support" }
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
