"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chat-store";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

/**
 * Chat window — message list + input + header
 */
export default function ChatWindow() {
  const {
    messages,
    status,
    isConnected,
    isTyping,
    sendMessage,
    closeChat,
    socket,
    chatId,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleTyping = (typing: boolean) => {
    if (socket?.connected && chatId) {
      socket.emit("typing", { chatId, isTyping: typing });
    }
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window__header">
        <div className="chat-window__header-info">
          <div className="chat-window__header-avatar">
            {status === "admin" ? "👤" : "🌿"}
          </div>
          <div>
            <h4 className="chat-window__header-title">
              {status === "admin" ? "Support Agent" : "PlantBot"}
            </h4>
            <span className="chat-window__header-status">
              {isConnected ? (
                <>
                  <span className="chat-window__dot chat-window__dot--online" />
                  Online
                </>
              ) : (
                <>
                  <span className="chat-window__dot chat-window__dot--offline" />
                  Connecting...
                </>
              )}
            </span>
          </div>
        </div>
        <button
          className="chat-window__close"
          onClick={closeChat}
          aria-label="Close chat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="chat-window__messages">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping?.isTyping && (
          <div className="chat-msg chat-msg--other">
            <div className="chat-msg__avatar">
              {isTyping.sender === "bot" ? "🌿" : "👤"}
            </div>
            <div className="chat-msg__body">
              <div className="chat-typing">
                <span className="chat-typing__dot" />
                <span className="chat-typing__dot" />
                <span className="chat-typing__dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onTyping={handleTyping}
        disabled={!isConnected}
        placeholder={
          status === "admin"
            ? "Chat with support..."
            : "Hỏi về cây xanh, vận chuyển, đơn hàng..."
        }
      />
    </div>
  );
}
