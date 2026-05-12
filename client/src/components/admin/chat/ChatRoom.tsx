"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import type { ChatConversation, ChatMessage as ChatMessageType } from "@/types/chat";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";

interface AdminChatRoomProps {
  chat: ChatConversation;
  socket: Socket;
  onBack: () => void;
}

/**
 * Admin chat room — view and reply to a specific conversation
 */
export default function AdminChatRoom({
  chat,
  socket,
  onBack,
}: AdminChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>(chat.messages);
  const [isTyping, setIsTyping] = useState(false);
  const [typingSender, setTypingSender] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Join the chat room on mount
  useEffect(() => {
    socket.emit("admin_join", { chatId: chat._id });

    const handleChatState = (data: {
      chatId: string;
      chat: ChatConversation;
    }) => {
      if (data.chatId === chat._id) {
        setMessages(data.chat.messages);
      }
    };

    const handleMessage = (data: {
      chatId: string;
      message: ChatMessageType;
    }) => {
      if (data.chatId === chat._id) {
        setMessages((prev) => [...prev, data.message]);
        setIsTyping(false);
      }
    };

    const handleTyping = (data: {
      chatId: string;
      sender: string;
      isTyping: boolean;
    }) => {
      if (data.chatId === chat._id) {
        setIsTyping(data.isTyping);
        setTypingSender(data.sender);
      }
    };

    socket.on("chat_state", handleChatState);
    socket.on("receive_message", handleMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("chat_state", handleChatState);
      socket.off("receive_message", handleMessage);
      socket.off("typing", handleTyping);
    };
  }, [chat._id, socket]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Sync messages when chat prop updates
  useEffect(() => {
    setMessages(chat.messages);
  }, [chat.messages]);

  const handleSend = (content: string) => {
    socket.emit("admin_message", { chatId: chat._id, content });

    // Optimistic update
    const adminMsg: ChatMessageType = {
      sender: "admin",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, adminMsg]);
  };

  const handleTakeover = () => {
    socket.emit("admin_takeover", { chatId: chat._id });
  };

  const handleRelease = () => {
    socket.emit("admin_release", { chatId: chat._id });
  };

  const handleClose = () => {
    socket.emit("close_chat", { chatId: chat._id });
    onBack();
  };

  const handleTypingIndicator = (typing: boolean) => {
    socket.emit("typing", { chatId: chat._id, isTyping: typing });
  };

  return (
    <div className="admin-chatroom">
      {/* Header */}
      <div className="admin-chatroom__header">
        <button className="admin-chatroom__back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="admin-chatroom__user">
          <div className="admin-chatroom__user-avatar">
            {chat.userName?.charAt(0)?.toUpperCase() || "G"}
          </div>
          <div>
            <h4>{chat.userName || "Guest"}</h4>
            <span className="admin-chatroom__user-email">
              {chat.userEmail || "No email"}
            </span>
          </div>
        </div>

        <div className="admin-chatroom__actions">
          {chat.status === "bot" ? (
            <button
              className="admin-chatroom__btn admin-chatroom__btn--takeover"
              onClick={handleTakeover}
            >
              🎯 Take Over
            </button>
          ) : (
            <button
              className="admin-chatroom__btn admin-chatroom__btn--release"
              onClick={handleRelease}
            >
              🤖 Release to Bot
            </button>
          )}
          <button
            className="admin-chatroom__btn admin-chatroom__btn--close"
            onClick={handleClose}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div
        className={`admin-chatroom__status ${chat.status === "admin" ? "admin-chatroom__status--admin" : "admin-chatroom__status--bot"}`}
      >
        {chat.status === "admin" ? (
          <>
            👤 You are handling this chat
            {chat.assignedAdminName && ` (${chat.assignedAdminName})`}
          </>
        ) : (
          <>🤖 Bot is handling this chat — Click &quot;Take Over&quot; to reply manually</>
        )}
      </div>

      {/* Messages */}
      <div className="admin-chatroom__messages">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && typingSender === "user" && (
          <div className="chat-msg chat-msg--other">
            <div className="chat-msg__avatar">🙂</div>
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

      {/* Input — only enabled when admin has taken over */}
      <ChatInput
        onSend={handleSend}
        onTyping={handleTypingIndicator}
        disabled={chat.status !== "admin"}
        placeholder={
          chat.status === "admin"
            ? "Type your reply..."
            : "Take over the chat to reply..."
        }
      />
    </div>
  );
}
