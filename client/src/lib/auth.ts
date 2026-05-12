export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("auth_token");
}

export function setToken(token: string, role?: string | null): void {
  localStorage.setItem("auth_token", token);
  if (role) {
    localStorage.setItem("auth_role", role);
  }
  const isProduction = process.env.NODE_ENV === "production";
  const secureFlag = isProduction ? "; Secure" : "";
  document.cookie = `auth_token=${token}; path=/; max-age=604800; samesite=lax${secureFlag}`;
  if (role) {
    document.cookie = `auth_role=${role}; path=/; max-age=604800; samesite=lax${secureFlag}`;
  }
}

export function clearToken(): void {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_role");
  document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
  document.cookie = "auth_role=; path=/; max-age=0; samesite=lax";
}
