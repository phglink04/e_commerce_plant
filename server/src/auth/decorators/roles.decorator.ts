import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (
  ...roles: Array<"user" | "admin" | "owner" | "deliverypartner">
) => SetMetadata(ROLES_KEY, roles);
