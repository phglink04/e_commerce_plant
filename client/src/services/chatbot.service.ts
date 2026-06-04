import { BaseApiService } from "./base-api.service";
import type {
  ChatbotSession,
  ChatbotResponse,
  ChatbotMessage,
  ChatStats,
} from "@/types/chatbot";

/**
 * Chatbot Service
 * API wrapper for AI chatbot & admin chat operations
 */
class ChatbotService extends BaseApiService {
  /**
   * Check chatbot status
   */
  async getStatus() {
    return this.get<{
      status: string;
      version: string;
      apiProvider: string;
      timestamp: string;
    }>("/api/chatbot/status");
  }

  /**
   * Create a new chat session
   */
  async createSession(userName: string, userId?: string) {
    return this.post<{
      id: string;
      userId?: string;
      userName: string;
      messages: any[];
      status: string;
      assignedAdminName?: string;
      createdAt: Date;
      updatedAt: Date;
      isExisting: boolean;
    }>("/api/chatbot/session/create", {
      userName,
      userId,
    });
  }

  /**
   * Create a brand new chat session (closes old ones)
   */
  async createNewSession(userName: string, userId?: string) {
    return this.post<{
      id: string;
      userId?: string;
      userName: string;
      messages: any[];
      status: string;
      createdAt: Date;
      updatedAt: Date;
      isExisting: boolean;
    }>("/api/chatbot/session/new", {
      userName,
      userId,
    });
  }

  /**
   * Send a message to the chatbot (AI mode)
   */
  async sendMessage(chatId: string, message: string) {
    return this.post<ChatbotResponse>("/api/chatbot/message/send", {
      chatId,
      message,
    });
  }

  /**
   * Get chat history
   */
  async getChatHistory(chatId: string) {
    return this.get<ChatbotSession>(`/api/chatbot/history/${chatId}`);
  }

  /**
   * Get all chats for a user
   */
  async getUserChats(userId: string) {
    return this.get<ChatbotSession[]>(`/api/chatbot/user/${userId}`);
  }

  /**
   * User requests admin support
   */
  async requestAdmin(chatId: string) {
    return this.post<ChatbotSession>("/api/chatbot/request-admin", {
      chatId,
    });
  }

  // ────────────── ADMIN ENDPOINTS ──────────────

  /**
   * Get all chat sessions (Admin Dashboard)
   */
  async getAllChats(status?: string) {
    const query = status ? `?status=${status}` : "";
    return this.get<ChatbotSession[]>(`/api/chatbot/admin/all${query}`);
  }

  /**
   * Get all active chats (Admin)
   */
  async getActiveChats() {
    return this.get<ChatbotSession[]>("/api/chatbot/admin/active");
  }

  /**
   * Get pending chats waiting for admin (Admin)
   */
  async getPendingChats() {
    return this.get<ChatbotSession[]>("/api/chatbot/admin/pending");
  }

  /**
   * Get chatbot statistics (Admin)
   */
  async getChatStats() {
    return this.get<ChatStats>("/api/chatbot/admin/stats");
  }

  /**
   * Get chats assigned to a specific admin (Admin)
   */
  async getAdminChats(adminId: string) {
    return this.get<ChatbotSession[]>(`/api/chatbot/admin/${adminId}`);
  }

  /**
   * Admin takes over a chat (Admin)
   */
  async adminTakeover(chatId: string, message?: string) {
    return this.post<ChatbotSession>("/api/chatbot/admin/takeover", {
      chatId,
      message,
    });
  }

  /**
   * Admin sends message to user (Admin)
   */
  async adminSendMessage(
    chatId: string,
    message: string,
    adminId?: string,
    adminName?: string
  ) {
    return this.post<any>("/api/chatbot/admin/send-message", {
      chatId,
      message,
      adminId,
      adminName,
    });
  }

  /**
   * Admin releases chat back to bot (Admin)
   */
  async adminReleaseChat(chatId: string) {
    return this.post<ChatbotSession>("/api/chatbot/admin/release", {
      chatId,
    });
  }

  /**
   * Admin closes a chat (Admin)
   */
  async closeChat(chatId: string, reason?: string) {
    return this.post<ChatbotSession>("/api/chatbot/admin/close", {
      chatId,
      reason,
    });
  }

  /**
   * Admin deletes a chat session (Admin)
   */
  async deleteChat(chatId: string) {
    return this.delete<any>(`/api/chatbot/admin/${chatId}`);
  }
}

export const chatbotService = new ChatbotService();
