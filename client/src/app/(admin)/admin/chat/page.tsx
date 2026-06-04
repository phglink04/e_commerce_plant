"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { chatbotService } from "@/services/chatbot.service";
import { useAuthStore } from "@/store/auth-store";
import { connectSocket, getSocket, disconnectSocket } from "@/lib/socket";
import type { ChatbotSession, ChatbotMessage } from "@/types/chatbot";
import "@/app/chat.css";

type FilterTab = "all" | "pending" | "active" | "closed";

export default function AdminChatPage() {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<ChatbotSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatbotSession | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ─── Fetch data ───────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const statusMap: Record<FilterTab, string | undefined> = {
        all: undefined,
        pending: "pending",
        active: "active",
        closed: "closed",
      };
      const response = await chatbotService.getAllChats(statusMap[filterTab]);
      setChats(response.data || []);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterTab]);

  const fetchChatHistory = useCallback(async (chatId: string) => {
    try {
      const response = await chatbotService.getChatHistory(chatId);
      const data = response.data;
      setSelectedChat(data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }, []);

  // ─── Initial load ─────────────────────────────────────────────
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // ─── WebSocket setup ──────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();

    socket.on("connect", () => {
      socket.emit("adminJoin");
    });

    // New pending chat alert
    socket.on("newPendingChat", () => {
      fetchChats();
    });

    // Chat updated (new messages, status changes)
    socket.on("chatUpdated", (data: { chatId: string }) => {
      fetchChats();
      // If currently viewing this chat, refresh it
      setSelectedChat((prev) => {
        if (prev && (prev._id === data.chatId || prev.id === data.chatId)) {
          fetchChatHistory(data.chatId);
        }
        return prev;
      });
    });

    // User typing indicator
    socket.on("userTyping", (data: { chatId: string; isTyping: boolean }) => {
      setSelectedChat((prev) => {
        if (prev && (prev._id === data.chatId || prev.id === data.chatId)) {
          setIsUserTyping(data.isTyping);
        }
        return prev;
      });
    });

    // New message in current chat
    socket.on("newMessage", (data: { chatId: string; message: ChatbotMessage }) => {
      setSelectedChat((prev) => {
        if (prev && (prev._id === data.chatId || prev.id === data.chatId)) {
          const msgs = prev.messages || [];
          // Avoid duplicate
          const isDuplicate = msgs.some(
            (m) =>
              m.content === data.message.content &&
              m.role === data.message.role &&
              Math.abs(new Date(m.timestamp).getTime() - new Date(data.message.timestamp).getTime()) < 2000
          );
          if (!isDuplicate) {
            return {
              ...prev,
              messages: [...msgs, data.message],
            };
          }
        }
        return prev;
      });
    });

    return () => {
      socket.off("newPendingChat");
      socket.off("chatUpdated");
      socket.off("userTyping");
      socket.off("newMessage");
      socket.off("connect");
    };
  }, [fetchChats, fetchChatHistory]);

  // Auto-scroll
  useEffect(() => {
    const container = messagesEndRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [selectedChat?.messages, isUserTyping]);

  // ─── Actions ──────────────────────────────────────────────────
  const handleSelectChat = (chat: ChatbotSession) => {
    const chatId = chat._id || chat.id;
    fetchChatHistory(chatId);
    setMobileShowChat(true);

    // Join the chat room
    const socket = getSocket();
    socket.emit("adminJoinChat", { chatId });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedChat || isSending) return;

    const chatId = selectedChat._id || selectedChat.id;
    const msg = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    try {
      const socket = getSocket();
      socket.emit("adminSendMessage", {
        chatId,
        message: msg,
        adminId: user?.id || "admin",
        adminName: user?.name || "Admin",
      });

      // Optimistic update
      const newMsg: ChatbotMessage = {
        role: "admin",
        content: msg,
        timestamp: new Date(),
        adminName: user?.name || "Admin",
      };
      setSelectedChat((prev) =>
        prev
          ? { ...prev, messages: [...(prev.messages || []), newMsg] }
          : prev
      );
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTakeover = async () => {
    if (!selectedChat) return;
    const chatId = selectedChat._id || selectedChat.id;

    try {
      const socket = getSocket();
      socket.emit("adminTakeover", {
        chatId,
        adminId: user?.id || "admin",
        adminName: user?.name || "Admin",
      });

      setSelectedChat((prev) =>
        prev
          ? {
              ...prev,
              status: "admin",
              assignedAdminName: user?.name || "Admin",
            }
          : prev
      );
      fetchChats();
    } catch (error) {
      console.error("Error taking over chat:", error);
    }
  };

  const handleRelease = async () => {
    if (!selectedChat) return;
    const chatId = selectedChat._id || selectedChat.id;

    try {
      const socket = getSocket();
      socket.emit("adminRelease", { chatId });

      setSelectedChat((prev) =>
        prev ? { ...prev, status: "bot", assignedAdminName: undefined } : prev
      );
      fetchChats();
    } catch (error) {
      console.error("Error releasing chat:", error);
    }
  };

  const handleClose = async () => {
    if (!selectedChat) return;
    const chatId = selectedChat._id || selectedChat.id;

    try {
      const socket = getSocket();
      socket.emit("adminCloseChat", {
        chatId,
        adminId: user?.id || "admin",
        reason: "Admin đã đóng cuộc trò chuyện",
      });

      setSelectedChat((prev) =>
        prev ? { ...prev, status: "closed", isClosed: true } : prev
      );
      fetchChats();
    } catch (error) {
      console.error("Error closing chat:", error);
    }
  };

  const handleDeleteChat = async (chatId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa vĩnh viễn cuộc trò chuyện này? Thao tác này không thể hoàn tác."
      )
    ) {
      return;
    }

    try {
      await chatbotService.deleteChat(chatId);
      if (
        selectedChat &&
        (selectedChat._id === chatId || selectedChat.id === chatId)
      ) {
        setSelectedChat(null);
      }
      fetchChats();
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Không thể xóa cuộc trò chuyện");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }

    // Typing indicator
    const socket = getSocket();
    const chatId = selectedChat?._id || selectedChat?.id;
    if (chatId) {
      socket.emit("adminTyping", { chatId, isTyping: true });
      setTimeout(() => {
        socket.emit("adminTyping", { chatId, isTyping: false });
      }, 2000);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────
  const formatTime = (timestamp: Date | string) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  const formatFullTime = (timestamp: Date | string) => {
    return new Date(timestamp).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLastMessage = (chat: ChatbotSession) => {
    const msgs = chat.messages || [];
    if (msgs.length === 0) return "Chưa có tin nhắn";
    const last = msgs[msgs.length - 1];
    const prefix =
      last.role === "admin" ? "Admin: " : last.role === "assistant" ? "Bot: " : "";
    const content = last.content.length > 50 ? last.content.substring(0, 50) + "..." : last.content;
    return prefix + content;
  };

  const getStatusBadge = (status: string | undefined) => {
    const badges: Record<string, { label: string; cls: string }> = {
      pending: { label: "Chờ xử lý", cls: "achat-badge achat-badge--pending" },
      admin: { label: "Admin", cls: "achat-badge achat-badge--admin" },
      closed: { label: "Đã đóng", cls: "achat-badge achat-badge--closed" },
      bot: { label: "Bot", cls: "achat-badge achat-badge--bot" },
    };
    const b = badges[status || "bot"] || badges.bot;
    return <span className={b.cls}>{b.label}</span>;
  };

  const getInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "?";
  };

  // Filter + search
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      chat.userName?.toLowerCase().includes(q) ||
      (chat.messages || []).some((m) => m.content?.toLowerCase().includes(q))
    );
  });

  // Count by status
  const pendingCount = chats.filter((c) => c.status === "pending").length;

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="achat-page">
      {/* Main Layout — full height */}
      <div className="admin-chat">
        {/* Sidebar */}
        <div
          className={`admin-chat__sidebar ${
            mobileShowChat ? "admin-chat__sidebar--hidden-mobile" : ""
          }`}
        >
          {/* Sidebar Header with search */}
          <div className="achat-sidebar-head">
            <div className="achat-sidebar-head__top">
              <h3>
                💬 Chat{" "}
                <span className="admin-chat__count">{filteredChats.length}</span>
              </h3>
              {pendingCount > 0 && (
                <span className="achat-pending-alert">
                  {pendingCount} chờ xử lý
                </span>
              )}
            </div>

            {/* Search */}
            <div className="achat-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="achat-search__clear">✕</button>
              )}
            </div>

            {/* Filter tabs — compact inside sidebar */}
            <div className="achat-filters">
              {(
                [
                  { key: "all", label: "Tất cả" },
                  { key: "pending", label: "Chờ xử lý" },
                  { key: "active", label: "Hoạt động" },
                  { key: "closed", label: "Đã đóng" },
                ] as { key: FilterTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`achat-filters__btn ${filterTab === tab.key ? "achat-filters__btn--active" : ""}`}
                >
                  {tab.label}
                  {tab.key === "pending" && pendingCount > 0 && (
                    <span className="achat-filters__dot" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat list */}
          <div className="admin-chat__list">
            {isLoading && filteredChats.length === 0 ? (
              <div className="admin-chat__empty">
                <div className="admin-chat__empty-icon">⏳</div>
                <p>Đang tải...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="admin-chat__empty">
                <div className="admin-chat__empty-icon">💬</div>
                <p>Chưa có cuộc trò chuyện nào</p>
                <p className="admin-chat__empty-sub">
                  {searchQuery ? "Không tìm thấy kết quả phù hợp" : "Các cuộc trò chuyện sẽ xuất hiện ở đây"}
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const chatId = chat._id || chat.id;
                const selectedId = selectedChat?._id || selectedChat?.id;
                const isActive = chatId === selectedId;

                return (
                  <button
                    key={chatId}
                    onClick={() => handleSelectChat(chat)}
                    className={`admin-chat__item ${
                      isActive ? "admin-chat__item--active" : ""
                    } ${chat.status === "pending" ? "admin-chat__item--unread" : ""}`}
                  >
                    <div className="admin-chat__item-avatar">
                      {getInitial(chat.userName)}
                    </div>
                    <div className="admin-chat__item-body">
                      <div className="admin-chat__item-top">
                        <span className="admin-chat__item-name">
                          {chat.userName}
                        </span>
                        <span className="admin-chat__item-time">
                          {formatTime(chat.updatedAt)}
                        </span>
                      </div>
                      <div className="admin-chat__item-bottom">
                        <span className="admin-chat__item-preview">
                          {getLastMessage(chat)}
                        </span>
                        <div className="admin-chat__item-meta">
                          {getStatusBadge(chat.status)}
                          <span
                            onClick={(e) => handleDeleteChat(chatId, e)}
                            className="admin-chat__item-delete-btn"
                            title="Xóa cuộc trò chuyện"
                            role="button"
                            aria-label="Xóa"
                            style={{ cursor: "pointer" }}
                          >
                            🗑️
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div
          className={`admin-chat__main ${
            !mobileShowChat ? "admin-chat__main--hidden-mobile" : ""
          }`}
        >
          {selectedChat ? (
            <div className="admin-chatroom">
              {/* Chat Room Header */}
              <div className="admin-chatroom__header">
                <button
                  className="admin-chatroom__back"
                  onClick={() => setMobileShowChat(false)}
                >
                  ← Quay lại
                </button>
                <div className="admin-chatroom__user">
                  <div className="admin-chatroom__user-avatar">
                    {getInitial(selectedChat.userName)}
                  </div>
                  <div>
                    <h4>{selectedChat.userName}</h4>
                    <span className="admin-chatroom__user-email">
                      {selectedChat.userId
                        ? "Thành viên"
                        : "Khách vãng lai"}
                    </span>
                  </div>
                </div>
                <div className="admin-chatroom__actions">
                  {selectedChat.status !== "admin" &&
                    selectedChat.status !== "closed" && (
                      <button
                        className="admin-chatroom__btn admin-chatroom__btn--takeover"
                        onClick={handleTakeover}
                      >
                        🛡️ Nhận chat
                      </button>
                    )}
                  {selectedChat.status === "admin" && (
                    <button
                      className="admin-chatroom__btn admin-chatroom__btn--release"
                      onClick={handleRelease}
                    >
                      🤖 Trả về Bot
                    </button>
                  )}
                  {selectedChat.status !== "closed" && (
                    <button
                      className="admin-chatroom__btn admin-chatroom__btn--close"
                      onClick={handleClose}
                    >
                      ✕ Đóng
                    </button>
                  )}
                  <button
                    className="admin-chatroom__btn admin-chatroom__btn--delete"
                    onClick={(e) => handleDeleteChat(selectedChat._id || selectedChat.id, e)}
                    title="Xóa vĩnh viễn"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>

              {/* Status Bar */}
              {selectedChat.status && selectedChat.status !== "closed" && (
                <div
                  className={`admin-chatroom__status ${
                    selectedChat.status === "admin"
                      ? "admin-chatroom__status--admin"
                      : "admin-chatroom__status--bot"
                  }`}
                >
                  {selectedChat.status === "admin"
                    ? `🛡️ Admin đang hỗ trợ: ${selectedChat.assignedAdminName || "Admin"}`
                    : selectedChat.status === "pending"
                    ? "⏳ Khách hàng đang chờ hỗ trợ từ admin"
                    : "🤖 AI Bot đang xử lý"}
                </div>
              )}

              {/* Messages */}
              <div ref={messagesEndRef} className="admin-chatroom__messages">
                {(selectedChat.messages || []).map((msg, idx) =>
                  msg.role === "system" ? (
                    <div key={idx} className="chat-msg-system">
                      <span>{msg.content}</span>
                    </div>
                  ) : (
                    <div
                      key={idx}
                      className={`chat-msg ${
                        msg.role === "admin"
                          ? "chat-msg--user"
                          : "chat-msg--other"
                      }`}
                    >
                      {msg.role !== "admin" && (
                        <div className="chat-msg__avatar">
                          {msg.role === "user" ? "👤" : "🌿"}
                        </div>
                      )}
                      <div className="chat-msg__body">
                        {msg.role !== "admin" && (
                          <span className="chat-msg__label">
                            {msg.role === "user"
                              ? selectedChat.userName
                              : "PlantBot"}
                          </span>
                        )}
                        {msg.role === "admin" && (
                          <span
                            className="chat-msg__label"
                            style={{ textAlign: "right" }}
                          >
                            {msg.adminName || "Admin"}
                          </span>
                        )}
                        <div
                          className={
                            msg.role === "user"
                              ? "chat-msg__bubble chat-msg__bubble--user"
                              : msg.role === "admin"
                              ? "chat-msg__bubble chat-msg__bubble--admin"
                              : "chat-msg__bubble chat-msg__bubble--bot"
                          }
                        >
                          {msg.content}
                        </div>
                        <span className="chat-msg__time">
                          {formatFullTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  )
                )}

                {/* User Typing */}
                {isUserTyping && (
                  <div className="chat-msg chat-msg--other">
                    <div className="chat-msg__avatar">👤</div>
                    <div className="chat-typing">
                      <span className="chat-typing__dot" />
                      <span className="chat-typing__dot" />
                      <span className="chat-typing__dot" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              {selectedChat.status === "admin" ? (
                <form onSubmit={handleSendMessage} className="chat-input">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập tin nhắn hỗ trợ..."
                    disabled={isSending}
                    className="chat-input__field"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputMessage.trim()}
                    className="chat-input__btn"
                    aria-label="Gửi"
                    style={{ background: "#2563eb" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
              ) : selectedChat.status !== "closed" ? (
                <div className="achat-input-placeholder">
                  <p>
                    {selectedChat.status === "pending"
                      ? "Khách hàng đang chờ hỗ trợ"
                      : "Chat đang được AI xử lý"}
                  </p>
                  <button onClick={handleTakeover} className="achat-takeover-btn">
                    🛡️ Nhận chat và hỗ trợ
                  </button>
                </div>
              ) : (
                <div className="achat-closed-bar">
                  ✕ Cuộc trò chuyện đã được đóng
                </div>
              )}
            </div>
          ) : (
            <div className="admin-chat__dashboard">
              <div className="admin-chat__dashboard-welcome">
                <div className="welcome-animation">🌿</div>
                <h3>Sẵn sàng hỗ trợ khách hàng</h3>
                <p>Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin trực tiếp với khách hàng hoặc theo dõi AI Bot trả lời.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
