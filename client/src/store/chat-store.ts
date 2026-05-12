/**
 * Chat Store — Zustand + Socket.IO
 * Manages real-time chat state for the user chat widget
 */

import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import type { ChatConversation, ChatMessage, TypingIndicator } from "@/types/chat";

interface ChatStore {
  // State
  socket: Socket | null;
  chatId: string | null;
  messages: ChatMessage[];
  status: "bot" | "admin";
  isConnected: boolean;
  isOpen: boolean;
  isTyping: TypingIndicator | null;
  unreadCount: number;
  isInitialized: boolean;

  // Actions
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  clearUnread: () => void;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ||
  "http://localhost:5000";

export const useChatStore = create<ChatStore>((set, get) => ({
  socket: null,
  chatId: null,
  messages: [],
  status: "bot",
  isConnected: false,
  isOpen: false,
  isTyping: null,
  unreadCount: 0,
  isInitialized: false,

  connect: () => {
    const { socket } = get();
    if (socket?.connected) return;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;

    const newSocket = io(`${API_URL}/chat`, {
      auth: { token: token || undefined },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      set({ isConnected: true });

      // If we already have a chatId, rejoin
      const { chatId } = get();
      if (chatId) {
        newSocket.emit("join_chat", { chatId });
      }
    });

    newSocket.on("disconnect", () => {
      set({ isConnected: false });
    });

    // Chat created (first message)
    newSocket.on("chat_created", (data: { chatId: string; chat: ChatConversation }) => {
      set({
        chatId: data.chatId,
        messages: data.chat.messages || [],
        status: data.chat.status,
        isInitialized: true,
      });
    });

    // Full chat state (when joining existing chat)
    newSocket.on("chat_state", (data: { chatId: string; chat: ChatConversation }) => {
      set({
        chatId: data.chatId,
        messages: data.chat.messages || [],
        status: data.chat.status,
        isInitialized: true,
      });
    });

    // Receive new message
    newSocket.on("receive_message", (data: { chatId: string; message: ChatMessage }) => {
      const { chatId, isOpen } = get();
      if (data.chatId !== chatId) return;

      set((state) => ({
        messages: [...state.messages, data.message],
        unreadCount: isOpen ? state.unreadCount : state.unreadCount + 1,
        isTyping: null,
      }));
    });

    // Admin takeover notification
    newSocket.on("admin_takeover", (data: { chatId: string; adminName: string }) => {
      const { chatId } = get();
      if (data.chatId !== chatId) return;
      set({ status: "admin" });
    });

    // Admin released
    newSocket.on("admin_released", (data: { chatId: string }) => {
      const { chatId } = get();
      if (data.chatId !== chatId) return;
      set({ status: "bot" });
    });

    // Chat closed
    newSocket.on("chat_closed", () => {
      set({
        chatId: null,
        messages: [],
        status: "bot",
        isInitialized: false,
      });
    });

    // Typing indicator
    newSocket.on("typing", (data: TypingIndicator) => {
      const { chatId } = get();
      if (data.chatId !== chatId) return;

      set({ isTyping: data.isTyping ? data : null });

      // Auto-clear typing after 3s
      if (data.isTyping) {
        setTimeout(() => {
          set((state) =>
            state.isTyping?.chatId === data.chatId ? { isTyping: null } : {},
          );
        }, 3000);
      }
    });

    // Error
    newSocket.on("error_message", (data: { message: string }) => {
      console.error("[Chat Error]", data.message);
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        chatId: null,
        messages: [],
        status: "bot",
        isTyping: null,
        isInitialized: false,
      });
    }
  },

  sendMessage: (content: string) => {
    const { socket, chatId } = get();
    if (!socket?.connected) return;

    // Optimistically add user message
    const userMsg: ChatMessage = {
      sender: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, userMsg],
    }));

    // Emit via WebSocket
    socket.emit("send_message", { chatId, content }, (response: any) => {
      // If this was the first message, we get the chatId back
      if (response?.chatId && !chatId) {
        set({ chatId: response.chatId });
        socket.emit("join_chat", { chatId: response.chatId });
      }
    });

    // Send typing = false
    if (chatId) {
      socket.emit("typing", { chatId, isTyping: false });
    }
  },

  toggleChat: () => {
    const { isOpen, isConnected, connect } = get();

    if (!isConnected) {
      connect();
    }

    set((state) => ({
      isOpen: !isOpen,
      unreadCount: !isOpen ? 0 : state.unreadCount,
    }));
  },

  openChat: () => {
    const { isConnected, connect } = get();
    if (!isConnected) connect();
    set({ isOpen: true, unreadCount: 0 });
  },

  closeChat: () => {
    set({ isOpen: false });
  },

  clearUnread: () => set({ unreadCount: 0 }),
}));
