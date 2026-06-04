import RoleWorkspaceLayout from "@/components/layouts/role-workspace-layout";

export default function DeliveryPartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menus = [
    { href: "/deliveryPartner/orders", label: "Vận đơn được giao" },
    { href: "/deliveryPartner/profile", label: "Thông tin cá nhân" },
    { href: "/deliveryPartner/settings", label: "Cấu hình tài khoản" },
  ];

  return (
    <RoleWorkspaceLayout
      allowedRoles={["deliverypartner"]}
      loginPath="/deliveryPartner/login"
      menus={menus}
      heading="Bảng Điều Hành Logistics"
      kind="delivery"
    >
      {children}
    </RoleWorkspaceLayout>
  );
}
