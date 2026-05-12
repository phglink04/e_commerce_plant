/**
 * Chat Service
 * REST API wrapper for chat operations (fallback for WebSocket)
 */

import { BaseApiService } from "./base-api.service";
import type { ChatConversation } from "@/types/chat";

class ChatService extends BaseApiService {
  /**
   * Get chat history for the current user
   */
  async getHistory() {
    return this.get<ChatConversation[]>("/api/chat/history");
  }

  /**
   * Get a specific chat by ID
   */
  async getChatById(chatId: string) {
    return this.get<ChatConversation>(`/api/chat/${chatId}`);
  }

  /**
   * Send a message via REST
   */
  async sendMessage(content: string, chatId?: string) {
    return this.post<{ chatId: string; chat: ChatConversation; botReply: any }>(
      "/api/chat/message",
      { content, chatId },
    );
  }

  /**
   * Admin: get all active chats
   */
  async getActiveChats() {
    return this.get<ChatConversation[]>("/api/chat/admin/active");
  }

  /**
   * Admin: take over a chat
   */
  async takeover(chatId: string) {
    return this.post<ChatConversation>("/api/chat/takeover", { chatId });
  }

  /**
   * Admin: release chat back to bot
   */
  async release(chatId: string) {
    return this.post<ChatConversation>("/api/chat/release", { chatId });
  }

  /**
   * Admin: close a chat
   */
  async closeChat(chatId: string) {
    return this.post<ChatConversation>("/api/chat/close", { chatId });
  }
}

export const chatService = new ChatService();
