"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function DeliveryPartnerLoginPage() {
  const router = useRouter();
  const { login, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const ok = await login({
      email,
      password,
      captchaToken: "delivery-login",
    });
    const nextUser = useAuthStore.getState().user;
    setLoading(false);

    if (!ok) {
      setError("Invalid email or password.");
      return;
    }

    if (!nextUser || nextUser.role !== "deliverypartner") {
      useAuthStore.getState().logout();
      setError("This account is not a delivery partner.");
      return;
    }

    router.push("/deliveryPartner");
  };

  return (
    <main className="container pw-page">
      <h1>Delivery Partner Login</h1>
      <p>Use a delivery partner account created from admin API.</p>

      {error ? <p className="error">{error}</p> : null}
      {user ? <p className="alert success">Logged in as {user.email}</p> : null}

      <form onSubmit={onSubmit} className="pw-address-form pw-role-login-form">
        <label htmlFor="delivery-email">Email</label>
        <input
          id="delivery-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="delivery-password">Password</label>
        <input
          id="delivery-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="pw-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login Delivery Partner"}
        </button>
      </form>
    </main>
  );
}
