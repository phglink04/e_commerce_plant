"use client";

import AdminChatList from "@/components/admin/chat/ChatList";

export default function AdminChatPage() {
  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          💬 Chat Support
        </h1>
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
          Manage customer conversations in real-time
        </p>
      </div>
      <AdminChatList />
    </div>
  );
}
