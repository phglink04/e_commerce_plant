"use client";

import { useState } from "react";
import { mockSettings } from "@/lib/mock-content";

export default function SettingsPage() {
  const [settings, setSettings] = useState(mockSettings);
  const [saved, setSaved] = useState(false);

  const onToggle = (key: keyof typeof mockSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <main className="container pw-account-page">
      <h1>Settings</h1>

      <section className="pw-settings-card">
        <label className="pw-switch-row">
          <span>Newsletter updates</span>
          <input
            type="checkbox"
            checked={settings.newsletter}
            onChange={() => onToggle("newsletter")}
          />
        </label>

        <label className="pw-switch-row">
          <span>SMS alerts</span>
          <input
            type="checkbox"
            checked={settings.smsAlert}
            onChange={() => onToggle("smsAlert")}
          />
        </label>

        <label className="pw-switch-row">
          <span>Dark mode</span>
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={() => onToggle("darkMode")}
          />
        </label>

        <button type="button" className="pw-btn" onClick={onSave}>
          {saved ? "Saved" : "Save Settings"}
        </button>
      </section>
    </main>
  );
}
