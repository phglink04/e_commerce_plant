import { create } from "zustand";
import { chatbotService } from "@/services/chatbot.service";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import type { ChatbotMessage, ChatbotSession } from "@/types/chatbot";

// ── localStorage keys ──
const LS_CHAT_ID = "plantworld_chat_id";
const LS_USER_ID = "plantworld_chat_user_id";

interface ChatbotStoreState {
  // State
  isOpen: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  chatId: string | null;
  userName: string | null;
  userId: string | null;
  messages: ChatbotMessage[];
  session: ChatbotSession | null;
  chatStatus: "bot" | "admin" | "pending" | "closed";
  adminName: string | null;
  isAdminTyping: boolean;
  socketConnected: boolean;
  lastSendTime: number;

  // Actions
  initializeChat: (userName: string, userId?: string) => Promise<void>;
  forceNewSession: (userName: string, userId?: string) => Promise<void>;
  toggleChat: () => void;
  sendMessage: (message: string) => Promise<void>;
  requestAdmin: () => Promise<void>;
  clearMessages: () => void;
  setChatId: (chatId: string) => void;
  setupSocket: () => void;
  cleanupSocket: () => void;
}

// Cooldown tối thiểu giữa 2 tin nhắn bot mode (ms)
const BOT_MSG_COOLDOWN = 2000;

export const useChatbotStore = create<ChatbotStoreState>((set, get) => ({
  // Initial State
  isOpen: false,
  isLoading: false,
  isInitialized: false,
  chatId: null,
  userName: null,
  userId: null,
  messages: [],
  session: null,
  chatStatus: "bot",
  adminName: null,
  isAdminTyping: false,
  socketConnected: false,
  lastSendTime: 0,

  // Actions
  initializeChat: async (userName: string, userId?: string) => {
    try {
      set({ isLoading: true });

      // Gọi API createSession — server sẽ trả session cũ nếu có
      const response = await chatbotService.createSession(userName, userId);
      const session = response.data;

      // Load messages từ session (nếu là session cũ)
      const existingMessages: ChatbotMessage[] = (session.messages || []).map(
        (m: any) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          adminName: m.adminName,
        })
      );

      // Persist chatId vào localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_CHAT_ID, session.id);
        if (userId) localStorage.setItem(LS_USER_ID, userId);
      }

      set({
        session: session as any,
        chatId: session.id,
        userName,
        userId: userId || null,
        messages: existingMessages,
        isInitialized: true,
        isLoading: false,
        chatStatus: (session.status as any) || "bot",
        adminName: session.assignedAdminName || null,
      });

      // Setup WebSocket after session is created
      get().setupSocket();
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      set({ isLoading: false });
    }
  },

  forceNewSession: async (userName: string, userId?: string) => {
    try {
      set({ isLoading: true });

      // Cleanup socket cũ
      get().cleanupSocket();

      // Gọi API tạo session mới (server sẽ đóng session cũ)
      const response = await chatbotService.createNewSession(userName, userId);
      const session = response.data;

      // Persist chatId mới
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_CHAT_ID, session.id);
        if (userId) localStorage.setItem(LS_USER_ID, userId);
      }

      set({
        session: session as any,
        chatId: session.id,
        userName,
        userId: userId || null,
        messages: [],
        isInitialized: true,
        isLoading: false,
        chatStatus: "bot",
        adminName: null,
      });

      // Setup WebSocket cho session mới
      get().setupSocket();
    } catch (error) {
      console.error("Failed to create new session:", error);
      set({ isLoading: false });
    }
  },

  setupSocket: () => {
    const { chatId } = get();
    if (!chatId) return;

    const socket = connectSocket();

    socket.on("connect", () => {
      set({ socketConnected: true });
      // Join chat room
      socket.emit("joinChat", { chatId });
    });

    socket.on("disconnect", () => {
      set({ socketConnected: false });
    });

    // Listen for new messages (from admin)
    socket.on("newMessage", (data: { chatId: string; message: ChatbotMessage }) => {
      const { chatId: currentChatId } = get();
      if (data.chatId === currentChatId) {
        // Only add if it's not from user (avoid duplicates)
        if (data.message.role !== "user") {
          set({ messages: [...get().messages, data.message] });
        }
      }
    });

    // Listen for chat status changes
    socket.on(
      "chatStatusChanged",
      (data: { chatId: string; status: string; adminName?: string }) => {
        const { chatId: currentChatId } = get();
        if (data.chatId === currentChatId) {
          set({
            chatStatus: data.status as any,
            adminName: data.adminName || null,
          });

          // Add system message about status change
          if (data.status === "admin" && data.adminName) {
            set({
              messages: [
                ...get().messages,
                {
                  role: "system",
                  content: `${data.adminName} đã tham gia cuộc trò chuyện`,
                  timestamp: new Date(),
                },
              ],
            });
          } else if (data.status === "bot") {
            set({
              messages: [
                ...get().messages,
                {
                  role: "system",
                  content: "Cuộc trò chuyện đã được chuyển về cho AI chatbot",
                  timestamp: new Date(),
                },
              ],
            });
          } else if (data.status === "closed") {
            set({
              messages: [
                ...get().messages,
                {
                  role: "system",
                  content: "Cuộc trò chuyện đã kết thúc. Cảm ơn bạn đã liên hệ!",
                  timestamp: new Date(),
                },
              ],
            });
          }
        }
      }
    );

    // Listen for admin typing
    socket.on(
      "adminTyping",
      (data: { chatId: string; isTyping: boolean }) => {
        const { chatId: currentChatId } = get();
        if (data.chatId === currentChatId) {
          set({ isAdminTyping: data.isTyping });
        }
      }
    );
  },

  cleanupSocket: () => {
    const socket = getSocket();
    socket.off("newMessage");
    socket.off("chatStatusChanged");
    socket.off("adminTyping");
    socket.off("connect");
    socket.off("disconnect");
    disconnectSocket();
    set({ socketConnected: false });
  },

  toggleChat: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },

  sendMessage: async (message: string) => {
    const { chatId, messages, chatStatus, lastSendTime } = get();

    if (!chatId) {
      console.error("No chat ID found");
      return;
    }

    // Cooldown check cho bot mode — tránh spam API gây 429
    if (chatStatus === "bot") {
      const elapsed = Date.now() - lastSendTime;
      if (elapsed < BOT_MSG_COOLDOWN) {
        console.warn(`Cooldown: vui lòng đợi ${Math.ceil((BOT_MSG_COOLDOWN - elapsed) / 1000)}s`);
        return;
      }
    }

    try {
      set({ isLoading: true, lastSendTime: Date.now() });

      // Add user message to local state immediately
      const userMessage: ChatbotMessage = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      set({
        messages: [...messages, userMessage],
      });

      if (chatStatus === "admin" || chatStatus === "pending") {
        // In admin mode, send via WebSocket
        const socket = getSocket();
        socket.emit("userSendMessage", { chatId, message });
        set({ isLoading: false });
      } else {
        // Bot mode — use REST API for AI response
        const response = await chatbotService.sendMessage(chatId, message);
        const botResponse = response.data;

        // Add bot response
        const assistantMessage: ChatbotMessage = {
          role: "assistant",
          content: botResponse.message,
          timestamp: botResponse.timestamp,
        };

        set({
          messages: [...get().messages, assistantMessage],
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);

      // Add error message
      set({
        messages: [
          ...get().messages,
          {
            role: "system",
            content: "Xin lỗi, không thể gửi tin nhắn. Vui lòng thử lại.",
            timestamp: new Date(),
          },
        ],
        isLoading: false,
      });
    }
  },

  requestAdmin: async () => {
    const { chatId } = get();
    if (!chatId) return;

    try {
      set({ isLoading: true });

      // Call REST API
      await chatbotService.requestAdmin(chatId);

      // Also emit via WebSocket for real-time
      const socket = getSocket();
      socket.emit("requestAdmin", { chatId });

      set({
        chatStatus: "pending",
        isLoading: false,
        messages: [
          ...get().messages,
          {
            role: "system",
            content:
              "Bạn đã yêu cầu hỗ trợ từ nhân viên. Vui lòng chờ trong giây lát...",
            timestamp: new Date(),
          },
        ],
      });
    } catch (error) {
      console.error("Failed to request admin:", error);
      set({ isLoading: false });
    }
  },

  clearMessages: () => {
    get().cleanupSocket();

    // Xóa localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_CHAT_ID);
      localStorage.removeItem(LS_USER_ID);
    }

    set({
      messages: [],
      chatId: null,
      session: null,
      isInitialized: false,
      chatStatus: "bot",
      adminName: null,
    });
  },

  setChatId: (chatId: string) => {
    set({ chatId });
  },
}));
