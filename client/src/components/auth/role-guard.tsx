"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import {
  getRoleHomePath,
  isAdminRole,
  isDeliveryPartnerRole,
  normalizeRole,
  type AppRole,
} from "@/lib/role-routing";

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  loginPath?: string;
};

export default function RoleGuard({
  children,
  allowedRoles,
  loginPath = "/auth/login",
}: RoleGuardProps) {
  const router = useRouter();
  const { token, user, hasHydrated } = useAuthStore();

  const role = useMemo(() => normalizeRole(user?.role), [user?.role]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!token) {
      router.replace(loginPath);
      return;
    }

    if (!role) {
      return;
    }

    const isAllowed = allowedRoles.some((allowedRole) => {
      if (allowedRole === "admin") {
        return isAdminRole(role);
      }

      if (allowedRole === "deliverypartner") {
        return isDeliveryPartnerRole(role);
      }

      return role === allowedRole;
    });

    if (!isAllowed) {
      router.replace(getRoleHomePath(role));
    }
  }, [allowedRoles, loginPath, role, router, token, hasHydrated]);

  if (!hasHydrated || !token || !role) {
    return <main className="container pw-admin-shell">Checking access...</main>;
  }

  return <>{children}</>;
}
