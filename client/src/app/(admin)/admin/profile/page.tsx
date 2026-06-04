"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/types/auth";

export default function AdminProfilePage() {
  const { token } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;

      try {
        const response = await api.get("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data?.data?.user ?? null);
      } catch {
        setError("Không thể tải trang cá nhân.");
      }
    };

    void fetchProfile();
  }, [token]);

  return (
    <section>
      <h1>Trang cá nhân Quản trị</h1>
      {error ? <p className="error">{error}</p> : null}
      <div className="pw-admin-list">
        <p>Tên: {profile?.name || "-"}</p>
        <p>Email: {profile?.email || "-"}</p>
        <p>Vai trò: {profile?.role || "-"}</p>
      </div>
    </section>
  );
}
