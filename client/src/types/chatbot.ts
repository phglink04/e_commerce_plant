export interface ChatbotMessage {
  role: "user" | "assistant" | "admin" | "system";
  content: string;
  timestamp: Date;
  adminName?: string;
}

export interface ChatbotSession {
  id: string;
  _id?: string;
  userId?: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: ChatbotMessage[];
  status?: "bot" | "admin" | "pending" | "closed";
  isActive?: boolean;
  isClosed?: boolean;
  assignedAdminId?: string;
  assignedAdminName?: string;
  closedReason?: string;
}

export interface ChatbotResponse {
  id: string;
  message: string;
  timestamp: Date;
}

export interface ChatbotSessionDto {
  userId?: string;
  userName: string;
}

export interface SendMessageDto {
  chatId: string;
  message: string;
}

export interface AdminSendMessageDto {
  chatId: string;
  message: string;
  adminId?: string;
  adminName?: string;
}

export interface ChatStats {
  totalChats: number;
  activeChats: number;
  closedChats: number;
  pendingChats: number;
  avgResponseTime: number;
}
