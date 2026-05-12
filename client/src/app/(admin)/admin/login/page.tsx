"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function AdminLoginPage() {
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

    const ok = await login({ email, password, captchaToken: "admin-login" });
    const nextUser = useAuthStore.getState().user;
    setLoading(false);

    if (!ok) {
      setError("Invalid email or password.");
      return;
    }

    if (!nextUser || (nextUser.role !== "admin" && nextUser.role !== "owner")) {
      useAuthStore.getState().logout();
      setError("This account is not allowed to access admin area.");
      return;
    }

    router.push("/admin");
  };

  return (
    <main className="container pw-page">
      <h1>Admin Login</h1>
      <p>Use an admin/owner account from backend to continue.</p>

      {error ? <p className="error">{error}</p> : null}
      {user ? <p className="alert success">Logged in as {user.email}</p> : null}

      <form onSubmit={onSubmit} className="pw-address-form pw-role-login-form">
        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="pw-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login Admin"}
        </button>
      </form>
    </main>
  );
}
