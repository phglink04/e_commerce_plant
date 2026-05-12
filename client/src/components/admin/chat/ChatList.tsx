"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ChatConversation } from "@/types/chat";
import AdminChatRoom from "./ChatRoom";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ||
  "http://localhost:5000";

/**
 * Admin Chat Dashboard
 * Lists all active chats with real-time updates
 */
export default function AdminChatList() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Connect to WebSocket as admin
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;

    const newSocket = io(`${API_URL}/chat`, {
      auth: { token: token || undefined },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("get_active_chats");
    });

    newSocket.on("disconnect", () => setIsConnected(false));

    // Receive active chats list
    newSocket.on("active_chats", (data: { chats: ChatConversation[] }) => {
      setChats(data.chats);
    });

    // New chat created
    newSocket.on("new_chat", () => {
      newSocket.emit("get_active_chats");
    });

    // Chat updated
    newSocket.on("chat_updated", (data: { chatId: string; chat: ChatConversation }) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c._id === data.chatId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data.chat;
          return updated.sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime(),
          );
        }
        return [data.chat, ...prev];
      });
    });

    // Escalated chat
    newSocket.on("escalated_chat", () => {
      newSocket.emit("get_active_chats");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const selectedChat = chats.find((c) => c._id === selectedChatId) || null;

  const getLastMessage = (chat: ChatConversation) => {
    const msgs = chat.messages;
    if (msgs.length === 0) return "No messages";
    const last = msgs[msgs.length - 1];
    const prefix =
      last.sender === "user"
        ? "User: "
        : last.sender === "admin"
          ? "You: "
          : last.sender === "bot"
            ? "Bot: "
            : "";
    const text = last.content.length > 50 ? last.content.slice(0, 50) + "…" : last.content;
    return prefix + text;
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="admin-chat">
      {/* Sidebar — Chat List */}
      <div className={`admin-chat__sidebar ${selectedChatId ? "admin-chat__sidebar--hidden-mobile" : ""}`}>
        <div className="admin-chat__sidebar-header">
          <h3>
            Live Chats
            <span className="admin-chat__count">{chats.length}</span>
          </h3>
          <span className={`admin-chat__status ${isConnected ? "admin-chat__status--online" : ""}`}>
            {isConnected ? "● Connected" : "○ Disconnected"}
          </span>
        </div>

        <div className="admin-chat__list">
          {chats.length === 0 && (
            <div className="admin-chat__empty">
              <span className="admin-chat__empty-icon">💬</span>
              <p>No active chats</p>
              <p className="admin-chat__empty-sub">
                Chat sessions will appear here when users start chatting
              </p>
            </div>
          )}

          {chats.map((chat) => (
            <button
              key={chat._id}
              className={`admin-chat__item ${selectedChatId === chat._id ? "admin-chat__item--active" : ""} ${chat.status === "admin" && chat.unreadCount > 0 ? "admin-chat__item--unread" : ""}`}
              onClick={() => setSelectedChatId(chat._id)}
            >
              <div className="admin-chat__item-avatar">
                {chat.userName?.charAt(0)?.toUpperCase() || "G"}
              </div>
              <div className="admin-chat__item-body">
                <div className="admin-chat__item-top">
                  <span className="admin-chat__item-name">
                    {chat.userName || "Guest"}
                  </span>
                  <span className="admin-chat__item-time">
                    {formatTime(chat.lastMessageAt)}
                  </span>
                </div>
                <div className="admin-chat__item-bottom">
                  <span className="admin-chat__item-preview">
                    {getLastMessage(chat)}
                  </span>
                  <div className="admin-chat__item-meta">
                    <span
                      className={`admin-chat__item-badge ${chat.status === "admin" ? "admin-chat__item-badge--admin" : "admin-chat__item-badge--bot"}`}
                    >
                      {chat.status === "admin" ? "👤 Admin" : "🤖 Bot"}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="admin-chat__item-unread">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main — Chat Room */}
      <div className={`admin-chat__main ${!selectedChatId ? "admin-chat__main--hidden-mobile" : ""}`}>
        {selectedChat && socket ? (
          <AdminChatRoom
            chat={selectedChat}
            socket={socket}
            onBack={() => setSelectedChatId(null)}
          />
        ) : (
          <div className="admin-chat__placeholder">
            <div className="admin-chat__placeholder-icon">🌿</div>
            <h3>Select a conversation</h3>
            <p>
              Choose a chat from the sidebar to start helping your customers
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
