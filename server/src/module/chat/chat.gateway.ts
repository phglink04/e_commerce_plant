import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Logger, UnauthorizedException } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { verify } from "jsonwebtoken";
import { JwtPayload } from "../../auth/types/jwt-payload.type";
import { ChatService } from "./chat.service";

/**
 * WebSocket Gateway for real-time chat
 *
 * Events:
 * - send_message:    User/Admin sends a message
 * - receive_message: Server pushes a new message
 * - admin_join:      Admin joins a specific chat room
 * - admin_takeover:  Admin takes over a chat from bot
 * - admin_release:   Admin releases chat back to bot
 * - typing:          Typing indicator
 * - chat_updated:    Full chat state update
 */
@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  },
  namespace: "/chat",
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  /** Map of userId → socketId for quick lookups */
  private userSockets = new Map<string, string>();

  /** Map of adminId → socketId */
  private adminSockets = new Map<string, string>();

  constructor(private readonly chatService: ChatService) {}

  // ─── LIFECYCLE ──────────────────────────────────────────────────

  afterInit() {
    this.logger.log("Chat WebSocket Gateway initialized");
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without auth token`);
        // Allow anonymous connections (guest chat) – assign a guest ID
        const guestId = `guest_${client.id}`;
        client.data = { sub: guestId, name: "Guest", role: "user" } as Partial<JwtPayload>;
        this.userSockets.set(guestId, client.id);
        client.join(`user_${guestId}`);
        return;
      }

      const payload = verify(
        token,
        process.env.JWT_SECRET ?? "dev-secret",
      ) as JwtPayload;

      client.data = payload;

      if (payload.role === "admin" || payload.role === "owner") {
        this.adminSockets.set(payload.sub, client.id);
        client.join("admin_room");
        this.logger.log(`Admin connected: ${payload.name} (${client.id})`);
      } else {
        this.userSockets.set(payload.sub, client.id);
        client.join(`user_${payload.sub}`);
        this.logger.log(`User connected: ${payload.name} (${client.id})`);
      }
    } catch (error) {
      this.logger.warn(`Auth failed for client ${client.id}`);
      // Still allow connection for guest usage
      const guestId = `guest_${client.id}`;
      client.data = { sub: guestId, name: "Guest", role: "user" } as Partial<JwtPayload>;
      this.userSockets.set(guestId, client.id);
      client.join(`user_${guestId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const payload = client.data as Partial<JwtPayload>;
    if (payload?.sub) {
      if (
        payload.role === "admin" ||
        payload.role === "owner"
      ) {
        this.adminSockets.delete(payload.sub);
        this.logger.log(`Admin disconnected: ${payload.name}`);
      } else {
        this.userSockets.delete(payload.sub);
        this.logger.log(`User disconnected: ${payload.name || payload.sub}`);
      }
    }
  }

  // ─── USER EVENTS ────────────────────────────────────────────────

  /**
   * User sends a message (or initiates a chat)
   */
  @SubscribeMessage("send_message")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { chatId?: string; content: string },
  ) {
    const payload = client.data as Partial<JwtPayload>;
    if (!payload?.sub) return;

    try {
      let chatId = data.chatId;

      // If no chatId, find or create chat
      if (!chatId) {
        const chat = await this.chatService.findOrCreateChat(
          payload.sub,
          payload.name || "Guest",
          payload.email || "",
        );
        chatId = (chat._id as any).toString();

        // Join the chat room
        client.join(`chat_${chatId}`);

        // Emit full chat state to user
        client.emit("chat_created", {
          chatId,
          chat,
        });

        // Notify admin room about new chat
        this.server.to("admin_room").emit("new_chat", {
          chatId,
          userId: payload.sub,
          userName: payload.name || "Guest",
          userEmail: payload.email || "",
        });
      }

      // Add user message and get potential bot reply
      const { chat, botReply } = await this.chatService.addUserMessage(
        chatId!,
        data.content,
      );

      // Emit user message to the chat room (admin sees it)
      this.server.to(`chat_${chatId}`).emit("receive_message", {
        chatId,
        message: {
          sender: "user",
          content: data.content,
          createdAt: new Date(),
        },
      });

      // Notify admin room about the update
      this.server.to("admin_room").emit("chat_updated", {
        chatId,
        chat,
      });

      // If bot replied, emit that too
      if (botReply) {
        // Small delay for "typing" effect
        setTimeout(() => {
          this.server.to(`chat_${chatId}`).emit("receive_message", {
            chatId,
            message: botReply,
          });

          // If escalated to admin, notify admin room
          if (chat.status === "admin") {
            this.server.to("admin_room").emit("escalated_chat", {
              chatId,
              chat,
            });
          }
        }, 800);

        // Send typing indicator before bot reply
        this.server.to(`chat_${chatId}`).emit("typing", {
          chatId,
          sender: "bot",
          isTyping: true,
        });

        setTimeout(() => {
          this.server.to(`chat_${chatId}`).emit("typing", {
            chatId,
            sender: "bot",
            isTyping: false,
          });
        }, 750);
      }

      return { success: true, chatId };
    } catch (error) {
      this.logger.error(`Error in send_message: ${error}`);
      client.emit("error_message", {
        message: "Failed to send message",
      });
    }
  }

  /**
   * User joins their existing chat
   */
  @SubscribeMessage("join_chat")
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    client.join(`chat_${data.chatId}`);
    this.logger.log(`Client ${client.id} joined chat ${data.chatId}`);

    try {
      const chat = await this.chatService.getChatById(data.chatId);
      client.emit("chat_state", { chatId: data.chatId, chat });
    } catch (error) {
      client.emit("error_message", { message: "Chat not found" });
    }
  }

  /**
   * Typing indicator
   */
  @SubscribeMessage("typing")
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const payload = client.data as Partial<JwtPayload>;
    const sender =
      payload?.role === "admin" || payload?.role === "owner"
        ? "admin"
        : "user";

    client.to(`chat_${data.chatId}`).emit("typing", {
      chatId: data.chatId,
      sender,
      isTyping: data.isTyping,
    });
  }

  // ─── ADMIN EVENTS ──────────────────────────────────────────────

  /**
   * Admin joins a specific chat room
   */
  @SubscribeMessage("admin_join")
  async handleAdminJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const payload = client.data as Partial<JwtPayload>;
    if (
      payload?.role !== "admin" &&
      payload?.role !== "owner"
    ) {
      client.emit("error_message", { message: "Unauthorized" });
      return;
    }

    client.join(`chat_${data.chatId}`);

    try {
      const chat = await this.chatService.getChatById(data.chatId);
      await this.chatService.markAsRead(data.chatId);
      client.emit("chat_state", { chatId: data.chatId, chat });
      this.logger.log(`Admin ${payload.name} joined chat ${data.chatId}`);
    } catch (error) {
      client.emit("error_message", { message: "Chat not found" });
    }
  }

  /**
   * Admin takes over a chat from the bot
   */
  @SubscribeMessage("admin_takeover")
  async handleAdminTakeover(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const payload = client.data as Partial<JwtPayload>;
    if (
      payload?.role !== "admin" &&
      payload?.role !== "owner"
    ) {
      client.emit("error_message", { message: "Unauthorized" });
      return;
    }

    try {
      const chat = await this.chatService.adminTakeover(
        data.chatId,
        payload.sub!,
        payload.name || "Admin",
      );

      // Join the chat room
      client.join(`chat_${data.chatId}`);

      // Notify everyone in the chat
      this.server.to(`chat_${data.chatId}`).emit("admin_takeover", {
        chatId: data.chatId,
        adminName: payload.name || "Admin",
      });

      // Send the system message
      const lastMsg = chat.messages[chat.messages.length - 1];
      this.server.to(`chat_${data.chatId}`).emit("receive_message", {
        chatId: data.chatId,
        message: lastMsg,
      });

      // Update admin room
      this.server.to("admin_room").emit("chat_updated", {
        chatId: data.chatId,
        chat,
      });

      this.logger.log(
        `Admin ${payload.name} took over chat ${data.chatId}`,
      );
    } catch (error) {
      client.emit("error_message", { message: "Takeover failed" });
    }
  }

  /**
   * Admin sends a message
   */
  @SubscribeMessage("admin_message")
  async handleAdminMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; content: string },
  ) {
    const payload = client.data as Partial<JwtPayload>;
    if (
      payload?.role !== "admin" &&
      payload?.role !== "owner"
    ) {
      client.emit("error_message", { message: "Unauthorized" });
      return;
    }

    try {
      const { chat, message } = await this.chatService.addAdminMessage(
        data.chatId,
        data.content,
        payload.sub!,
        payload.name || "Admin",
      );

      // Broadcast to everyone in the chat room
      this.server.to(`chat_${data.chatId}`).emit("receive_message", {
        chatId: data.chatId,
        message,
      });

      // Update admin room
      this.server.to("admin_room").emit("chat_updated", {
        chatId: data.chatId,
        chat,
      });
    } catch (error) {
      client.emit("error_message", { message: "Failed to send message" });
    }
  }

  /**
   * Admin releases chat back to bot
   */
  @SubscribeMessage("admin_release")
  async handleAdminRelease(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const payload = client.data as Partial<JwtPayload>;
    if (
      payload?.role !== "admin" &&
      payload?.role !== "owner"
    ) {
      client.emit("error_message", { message: "Unauthorized" });
      return;
    }

    try {
      const chat = await this.chatService.releaseToBot(data.chatId);

      // Notify chat room
      const lastMsg = chat.messages[chat.messages.length - 1];
      this.server.to(`chat_${data.chatId}`).emit("receive_message", {
        chatId: data.chatId,
        message: lastMsg,
      });

      this.server.to(`chat_${data.chatId}`).emit("admin_released", {
        chatId: data.chatId,
      });

      // Update admin room
      this.server.to("admin_room").emit("chat_updated", {
        chatId: data.chatId,
        chat,
      });
    } catch (error) {
      client.emit("error_message", { message: "Release failed" });
    }
  }

  /**
   * Admin closes a chat
   */
  @SubscribeMessage("close_chat")
  async handleCloseChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const payload = client.data as Partial<JwtPayload>;
    if (
      payload?.role !== "admin" &&
      payload?.role !== "owner"
    ) {
      client.emit("error_message", { message: "Unauthorized" });
      return;
    }

    try {
      const chat = await this.chatService.closeChat(data.chatId);

      this.server.to(`chat_${data.chatId}`).emit("chat_closed", {
        chatId: data.chatId,
      });

      this.server.to("admin_room").emit("chat_updated", {
        chatId: data.chatId,
        chat,
      });
    } catch (error) {
      client.emit("error_message", { message: "Close failed" });
    }
  }

  /**
   * Admin requests list of active chats
   */
  @SubscribeMessage("get_active_chats")
  async handleGetActiveChats(@ConnectedSocket() client: Socket) {
    const payload = client.data as Partial<JwtPayload>;
    if (
      payload?.role !== "admin" &&
      payload?.role !== "owner"
    ) {
      client.emit("error_message", { message: "Unauthorized" });
      return;
    }

    try {
      const chats = await this.chatService.getActiveChats();
      client.emit("active_chats", { chats });
    } catch (error) {
      client.emit("error_message", { message: "Failed to get chats" });
    }
  }
}
