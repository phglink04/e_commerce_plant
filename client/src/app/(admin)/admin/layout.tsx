import RoleWorkspaceLayout from "@/components/layouts/role-workspace-layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menus = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/plants", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/deliveryPartner", label: "Delivery Partners" },
    { href: "/admin/home-settings", label: "Home Page Builder" },
    { href: "/admin/blogs", label: "Blogs" },
    { href: "/admin/discounts", label: "Discounts" },
    { href: "/admin/reviews", label: "Reviews" },
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
