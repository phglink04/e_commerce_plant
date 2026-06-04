"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChatbotStore } from "@/store/chatbot-store";
import { useAuthStore } from "@/store/auth-store";
import "@/app/chat.css";

/**
 * ChatbotWidget — Premium floating chat with AI + Admin real-time support
 */
export default function ChatbotWidget() {
  const {
    isOpen,
    isLoading,
    isInitialized,
    toggleChat,
    initializeChat,
    sendMessage,
    requestAdmin,
    forceNewSession,
    messages,
    chatStatus,
    adminName,
    isAdminTyping,
  } = useChatbotStore();

  const { user } = useAuthStore();
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize chatbot on first open
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const userName = user?.name || "Khách";
      const userId = user?.id;
      initializeChat(userName, userId);
    }
  }, [isOpen, isInitialized, initializeChat, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isAdminTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputMessage.trim() || isLoading) return;

      const msg = inputMessage.trim();
      setInputMessage("");
      await sendMessage(msg);
    },
    [inputMessage, isLoading, sendMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleRequestAdmin = async () => {
    await requestAdmin();
  };

  const handleNewChat = () => {
    const userName = user?.name || "Khách";
    const userId = user?.id;
    forceNewSession(userName, userId);
  };

  const formatTime = (timestamp: Date) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusText = () => {
    switch (chatStatus) {
      case "admin":
        return `${adminName || "Admin"} đang hỗ trợ`;
      case "pending":
        return "Đang chờ nhân viên hỗ trợ...";
      case "closed":
        return "Cuộc trò chuyện đã kết thúc";
      default:
        return "AI Trợ lý cây cảnh";
    }
  };

  const getStatusDotClass = () => {
    if (chatStatus === "pending") return "chat-window__dot chat-window__dot--offline";
    return "chat-window__dot chat-window__dot--online";
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "user":
        return "👤";
      case "assistant":
        return "🌿";
      case "admin":
        return "🛡️";
      default:
        return "ℹ️";
    }
  };

  const getBubbleClass = (role: string) => {
    switch (role) {
      case "user":
        return "chat-msg__bubble chat-msg__bubble--user";
      case "admin":
        return "chat-msg__bubble chat-msg__bubble--admin";
      default:
        return "chat-msg__bubble chat-msg__bubble--bot";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "user":
        return "";
      case "assistant":
        return "PlantBot";
      case "admin":
        return adminName || "Admin";
      default:
        return "";
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="chat-widget__window">
          <div className="chat-window">
            {/* Header */}
            <div className="chat-window__header">
              <div className="chat-window__header-info">
                <div className="chat-window__header-avatar">
                  {chatStatus === "admin" ? "🛡️" : "🌿"}
                </div>
                <div>
                  <h3 className="chat-window__header-title">
                    {chatStatus === "admin"
                      ? adminName || "Admin Support"
                      : "PlantBot"}
                  </h3>
                  <div className="chat-window__header-status">
                    <span className={getStatusDotClass()} />
                    {getStatusText()}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="chat-window__close"
                aria-label="Đóng chat"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="chat-window__messages">
              {messages.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🌿</div>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: "1rem",
                      color: "#1f2937",
                      marginBottom: "8px",
                    }}
                  >
                    Xin chào! 👋
                  </p>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#6b7280",
                      lineHeight: 1.6,
                    }}
                  >
                    Tôi là trợ lý AI của PlantWorld. Tôi có thể giúp bạn:
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      marginTop: "12px",
                    }}
                  >
                    {[
                      "🌱 Tìm cây phù hợp",
                      "💡 Hướng dẫn chăm sóc",
                      "🚚 Thông tin vận chuyển",
                      "💳 Hỗ trợ thanh toán",
                    ].map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          const text = item.replace(/^[^\s]+\s/, "");
                          setInputMessage(text);
                          inputRef.current?.focus();
                        }}
                        style={{
                          padding: "8px 14px",
                          background: "#f0fdf4",
                          border: "1px solid #dcfce7",
                          borderRadius: "10px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                          color: "#15803d",
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.background = "#dcfce7";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.background = "#f0fdf4";
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) =>
                    msg.role === "system" ? (
                      <div key={idx} className="chat-msg-system">
                        <span>{msg.content}</span>
                      </div>
                    ) : (
                      <div
                        key={idx}
                        className={`chat-msg ${
                          msg.role === "user"
                            ? "chat-msg--user"
                            : "chat-msg--other"
                        }`}
                      >
                        {msg.role !== "user" && (
                          <div className="chat-msg__avatar">
                            {getRoleIcon(msg.role)}
                          </div>
                        )}
                        <div className="chat-msg__body">
                          {msg.role !== "user" && (
                            <span className="chat-msg__label">
                              {getRoleLabel(msg.role)}
                            </span>
                          )}
                          <div className={getBubbleClass(msg.role)}>
                            {msg.content}
                          </div>
                          <span className="chat-msg__time">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    )
                  )}

                  {/* Typing indicator */}
                  {(isLoading || isAdminTyping) && (
                    <div className="chat-msg chat-msg--other">
                      <div className="chat-msg__avatar">
                        {isAdminTyping ? "🛡️" : "🌿"}
                      </div>
                      <div className="chat-typing">
                        <span className="chat-typing__dot" />
                        <span className="chat-typing__dot" />
                        <span className="chat-typing__dot" />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Action bar: request admin / new chat */}
            {chatStatus !== "closed" && (
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  padding: "6px 16px",
                  borderTop: "1px solid #f3f4f6",
                  background: "#fff",
                }}
              >
                {chatStatus === "bot" && (
                  <button
                    onClick={handleRequestAdmin}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      background: "#eff6ff",
                      border: "1px solid #dbeafe",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#2563eb",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.background = "#dbeafe";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background = "#eff6ff";
                    }}
                  >
                    🛡️ Chat với nhân viên
                  </button>
                )}
                {chatStatus === "pending" && (
                  <div
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      background: "#fffbeb",
                      border: "1px solid #fef3c7",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: "#b45309",
                      textAlign: "center",
                    }}
                  >
                    ⏳ Đang chờ nhân viên hỗ trợ...
                  </div>
                )}
                {chatStatus === "admin" && (
                  <div
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      background: "#eff6ff",
                      border: "1px solid #dbeafe",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: "#2563eb",
                      textAlign: "center",
                    }}
                  >
                    🛡️ Đang chat với {adminName || "Admin"}
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            {chatStatus !== "closed" ? (
              <form onSubmit={handleSendMessage} className="chat-input">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    chatStatus === "admin" || chatStatus === "pending"
                      ? "Nhắn tin cho nhân viên..."
                      : "Hỏi về cây cảnh..."
                  }
                  disabled={isLoading && chatStatus === "bot"}
                  className="chat-input__field"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={
                    (isLoading && chatStatus === "bot") || !inputMessage.trim()
                  }
                  className="chat-input__btn"
                  aria-label="Gửi"
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
            ) : (
              <div className="chat-input" style={{ justifyContent: "center" }}>
                <button
                  onClick={handleNewChat}
                  style={{
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #16a34a, #059669)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.transform = "scale(1)";
                  }}
                >
                  🌿 Bắt đầu cuộc trò chuyện mới
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className={`chat-widget__fab ${isOpen ? "chat-widget__fab--open" : ""}`}
        aria-label={isOpen ? "Đóng chat" : "Mở chat"}
      >
        {isOpen ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  );
}
