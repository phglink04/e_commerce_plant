"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chat-store";
import ChatWindow from "./ChatWindow";

/**
 * Floating chat widget — button + window overlay
 * Mount this in the root layout for public pages
 */
export default function ChatWidget() {
  const { isOpen, toggleChat, unreadCount, connect, isConnected } =
    useChatStore();

  // Auto-connect on mount so we can receive messages even when closed
  useEffect(() => {
    // Delay connection slightly to avoid blocking page load
    const timer = setTimeout(() => {
      if (!isConnected) connect();
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="chat-widget__window">
          <ChatWindow />
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`chat-widget__fab ${isOpen ? "chat-widget__fab--open" : ""}`}
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        id="chat-widget-fab"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {unreadCount > 0 && (
              <span className="chat-widget__badge">{unreadCount}</span>
            )}
          </>
        )}
      </button>
    </>
  );
}
