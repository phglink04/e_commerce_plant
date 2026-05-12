export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  accountType: "LOCAL" | "GOOGLE";
  role: "user" | "admin" | "owner" | "deliverypartner";
  isTwoFactorEnabled: boolean;
};
