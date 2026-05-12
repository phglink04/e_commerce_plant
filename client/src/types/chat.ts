/**
 * Chat System Types
 */

export interface ChatMessage {
  sender: "user" | "bot" | "admin" | "system";
  content: string;
  createdAt: string | Date;
}

export interface ChatConversation {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "bot" | "admin";
  messages: ChatMessage[];
  assignedAdminId: string | null;
  assignedAdminName: string;
  isClosed: boolean;
  unreadCount: number;
  lastMessageAt: string | Date;
  createdAt: string;
  updatedAt: string;
}

export interface TypingIndicator {
  chatId: string;
  sender: "user" | "bot" | "admin";
  isTyping: boolean;
}

export interface ChatState {
  chatId: string | null;
  chat: ChatConversation | null;
  messages: ChatMessage[];
  isConnected: boolean;
  isTyping: TypingIndicator | null;
  isOpen: boolean;
  unreadCount: number;
}
