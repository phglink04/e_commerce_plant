export type AppRole = "user" | "admin" | "owner" | "deliverypartner";

export const normalizeRole = (
  role: string | null | undefined,
): AppRole | null => {
  if (!role) {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  if (
    normalized === "user" ||
    normalized === "admin" ||
    normalized === "owner" ||
    normalized === "deliverypartner"
  ) {
    return normalized;
  }

  return null;
};

export const isAdminRole = (role: AppRole | null): boolean =>
  role === "admin" || role === "owner";

export const isDeliveryPartnerRole = (role: AppRole | null): boolean =>
  role === "deliverypartner";

export const getRoleHomePath = (role: AppRole | null): string => {
  if (isAdminRole(role)) {
    return "/admin";
  }

  if (isDeliveryPartnerRole(role)) {
    return "/deliveryPartner";
  }

  return "/";
};

export const decodeRoleFromJwt = (
  token: string | null | undefined,
): AppRole | null => {
  if (!token) {
    return null;
  }

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      return null;
    }

    const normalizedBase64 = payloadBase64
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalizedBase64.length % 4)) % 4);
    const decoded = atob(`${normalizedBase64}${padding}`);
    const payload = JSON.parse(decoded) as { role?: string };

    return normalizeRole(payload.role);
  } catch {
    return null;
  }
};
