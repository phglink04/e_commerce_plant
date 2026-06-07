import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  decodeRoleFromJwt,
  getRoleHomePath,
  isAdminRole,
  isDeliveryPartnerRole,
  normalizeRole,
} from "@/lib/role-routing";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Tránh cache redirect đối với prefetch request (Next.js prefetch router cache bug trên production)
  const isPrefetch =
    request.headers.get("x-middleware-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch";

  if (isPrefetch) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value ?? null;
  const roleFromCookie = normalizeRole(request.cookies.get("auth_role")?.value);
  const role = roleFromCookie ?? decodeRoleFromJwt(token);
  const userHomePath = getRoleHomePath(role);

  const loginRoutes = ["/auth/login", "/admin/login", "/deliveryPartner/login"];
  const protectedPrefixes = [
    "/dashboard",
    "/profile",
    "/settings",
    "/my-orders",
    "/cart",
    "/checkout",
    "/order-success",
    "/admin",
    "/deliveryPartner",
  ];
  const userOnlyPrefixes = [
    "/profile",
    "/settings",
    "/my-orders",
    "/cart",
    "/checkout",
    "/order-success",
  ];

  const isLoginRoute = loginRoutes.includes(pathname);
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (token && role && isLoginRoute) {
    const response = NextResponse.redirect(new URL(userHomePath, request.url));
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  }

  if (isProtectedRoute && !token && !isLoginRoute) {
    let redirectLogin = "/auth/login";
    if (pathname.startsWith("/admin")) {
      redirectLogin = "/admin/login";
    } else if (pathname.startsWith("/deliveryPartner")) {
      redirectLogin = "/deliveryPartner/login";
    }
    const response = NextResponse.redirect(new URL(redirectLogin, request.url));
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  }

  if (pathname.startsWith("/admin") && !isLoginRoute && token && !isAdminRole(role)) {
    const response = NextResponse.redirect(new URL(userHomePath, request.url));
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  }

  if (
    pathname.startsWith("/deliveryPartner") &&
    !isLoginRoute &&
    token &&
    !isDeliveryPartnerRole(role)
  ) {
    const response = NextResponse.redirect(new URL(userHomePath, request.url));
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  }

  const isUserOnlyRoute = userOnlyPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (isUserOnlyRoute && token && role && role !== "user") {
    const response = NextResponse.redirect(new URL(userHomePath, request.url));
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/my-orders/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/order-success/:path*",
    "/admin",
    "/admin/:path*",
    "/deliveryPartner",
    "/deliveryPartner/:path*",
  ],
};
