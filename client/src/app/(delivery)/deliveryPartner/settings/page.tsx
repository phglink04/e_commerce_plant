"use client";

import { useState } from "react";

export default function DeliveryPartnerSettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [saved, setSaved] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setNewPassword("");
    }, 1000);
  };

  return (
    <section>
      <h1>Delivery Partner Settings</h1>
      <form className="pw-address-form" onSubmit={onSubmit}>
        <label htmlFor="newPassword">New Password</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button className="pw-btn" type="submit">
          {saved ? "Password Updated" : "Update Password"}
        </button>
      </form>
    </section>
  );
}
