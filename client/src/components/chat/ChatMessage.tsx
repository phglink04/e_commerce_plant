"use client";

import { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * Individual chat message bubble
 */
export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";
  const isBot = message.sender === "bot";
  const isAdmin = message.sender === "admin";

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSystem) {
    return (
      <div className="chat-msg-system">
        <span>{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`chat-msg ${isUser ? "chat-msg--user" : "chat-msg--other"}`}>
      {!isUser && (
        <div className="chat-msg__avatar">
          {isBot ? "🌿" : "👤"}
        </div>
      )}
      <div className="chat-msg__body">
        {!isUser && (
          <span className="chat-msg__label">
            {isBot ? "PlantBot" : isAdmin ? "Support" : ""}
          </span>
        )}
        <div className={`chat-msg__bubble ${isUser ? "chat-msg__bubble--user" : isBot ? "chat-msg__bubble--bot" : "chat-msg__bubble--admin"}`}>
          {message.content}
        </div>
        <span className="chat-msg__time">{time}</span>
      </div>
    </div>
  );
}
