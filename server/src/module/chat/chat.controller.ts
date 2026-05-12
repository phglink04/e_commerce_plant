import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../../auth/guards/admin.guard";
import { JwtPayload } from "../../auth/types/jwt-payload.type";

/**
 * Chat REST Controller
 * Provides REST endpoints alongside WebSocket for chat operations
 */
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * GET /api/chat/history
   * Get chat history for the authenticated user
   */
  @Get("history")
  @UseGuards(JwtAuthGuard)
  async getChatHistory(@Req() req: { user: JwtPayload }) {
    const chats = await this.chatService.getUserChats(req.user.sub);
    return {
      status: "success",
      data: chats,
    };
  }

  /**
   * GET /api/chat/:chatId
   * Get a specific chat by ID
   */
  @Get(":chatId")
  @UseGuards(JwtAuthGuard)
  async getChat(@Param("chatId") chatId: string) {
    const chat = await this.chatService.getChatById(chatId);
    return {
      status: "success",
      data: chat,
    };
  }

  /**
   * POST /api/chat/message
   * Send a message via REST (fallback for WebSocket)
   */
  @Post("message")
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Req() req: { user: JwtPayload },
    @Body() body: { chatId?: string; content: string },
  ) {
    let chatId = body.chatId;

    // Create chat if needed
    if (!chatId) {
      const chat = await this.chatService.findOrCreateChat(
        req.user.sub,
        req.user.name,
        req.user.email,
      );
      chatId = (chat._id as any).toString();
    }

    const { chat, botReply } = await this.chatService.addUserMessage(
      chatId!,
      body.content,
    );

    return {
      status: "success",
      data: {
        chatId,
        chat,
        botReply,
      },
    };
  }

  /**
   * POST /api/chat/takeover
   * Admin takes over a chat (REST endpoint)
   */
  @Post("takeover")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async adminTakeover(
    @Req() req: { user: JwtPayload },
    @Body() body: { chatId: string },
  ) {
    const chat = await this.chatService.adminTakeover(
      body.chatId,
      req.user.sub,
      req.user.name,
    );

    return {
      status: "success",
      data: chat,
    };
  }

  /**
   * POST /api/chat/release
   * Admin releases chat back to bot
   */
  @Post("release")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async releaseToBot(@Body() body: { chatId: string }) {
    const chat = await this.chatService.releaseToBot(body.chatId);
    return {
      status: "success",
      data: chat,
    };
  }

  /**
   * POST /api/chat/close
   * Close a chat
   */
  @Post("close")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async closeChat(@Body() body: { chatId: string }) {
    const chat = await this.chatService.closeChat(body.chatId);
    return {
      status: "success",
      data: chat,
    };
  }

  /**
   * GET /api/chat/admin/active
   * Get all active chats (admin only)
   */
  @Get("admin/active")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getActiveChats() {
    const chats = await this.chatService.getActiveChats();
    return {
      status: "success",
      data: chats,
    };
  }
}
