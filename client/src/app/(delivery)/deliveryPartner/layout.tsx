import RoleWorkspaceLayout from "@/components/layouts/role-workspace-layout";

export default function DeliveryPartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menus = [
    { href: "/deliveryPartner/orders", label: "Assigned Orders" },
    { href: "/deliveryPartner/profile", label: "Profile" },
    { href: "/deliveryPartner/settings", label: "Settings" },
  ];

  return (
    <RoleWorkspaceLayout
      allowedRoles={["deliverypartner"]}
      loginPath="/deliveryPartner/login"
      menus={menus}
      heading="Delivery Workspace"
      kind="delivery"
    >
      {children}
    </RoleWorkspaceLayout>
  );
}
