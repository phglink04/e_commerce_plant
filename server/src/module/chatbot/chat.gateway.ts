import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatbotService } from './chatbot.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatbotService: ChatbotService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ────────────── USER EVENTS ──────────────

  /**
   * User joins a chat room
   */
  @SubscribeMessage('joinChat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    client.join(`chat_${data.chatId}`);
    this.logger.log(`Client ${client.id} joined chat_${data.chatId}`);
    return { event: 'joinedChat', data: { chatId: data.chatId } };
  }

  /**
   * User sends a message (while in admin mode, bypasses AI)
   */
  @SubscribeMessage('userSendMessage')
  async handleUserMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; message: string },
  ) {
    try {
      // Check chat status - if admin mode, just save message without AI
      const chat = await this.chatbotService.getChatHistory(data.chatId);

      if (chat && (chat.status === 'admin' || chat.status === 'pending')) {
        // Save user message directly (no AI response)
        const chatDoc = await this.chatbotService.getChatHistory(data.chatId);
        if (chatDoc) {
          chatDoc.messages.push({
            role: 'user' as any,
            content: data.message,
            timestamp: new Date(),
          });
          chatDoc.updatedAt = new Date();
          await (chatDoc as any).save();
        }

        const userMsg = {
          role: 'user',
          content: data.message,
          timestamp: new Date(),
        };

        // Broadcast to room (admin will receive)
        this.server.to(`chat_${data.chatId}`).emit('newMessage', {
          chatId: data.chatId,
          message: userMsg,
        });

        // Also notify admin room for sidebar update
        this.server.to('admin_room').emit('chatUpdated', {
          chatId: data.chatId,
          lastMessage: data.message,
          lastMessageTime: new Date(),
        });
      } else {
        // Bot mode - use AI response via REST (already handled by chatbot-store)
        // Just broadcast user message for any admin watching
        this.server.to(`chat_${data.chatId}`).emit('newMessage', {
          chatId: data.chatId,
          message: {
            role: 'user',
            content: data.message,
            timestamp: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.error('Error handling user message:', error);
      client.emit('error', { message: 'Lỗi khi gửi tin nhắn' });
    }
  }

  /**
   * User requests admin support
   */
  @SubscribeMessage('requestAdmin')
  async handleRequestAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      const chat = await this.chatbotService.requestAdmin(data.chatId);

      // Notify the chat room
      this.server.to(`chat_${data.chatId}`).emit('chatStatusChanged', {
        chatId: data.chatId,
        status: 'pending',
      });

      // Notify admin room about new pending chat
      this.server.to('admin_room').emit('newPendingChat', {
        chatId: chat._id.toString(),
        userName: chat.userName,
        status: 'pending',
        updatedAt: chat.updatedAt,
      });

      return { event: 'adminRequested', data: { chatId: data.chatId } };
    } catch (error) {
      this.logger.error('Error requesting admin:', error);
      client.emit('error', { message: 'Lỗi khi yêu cầu admin' });
    }
  }

  /**
   * User typing indicator
   */
  @SubscribeMessage('userTyping')
  handleUserTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    // Broadcast to room (admin receives)
    client.to(`chat_${data.chatId}`).emit('userTyping', {
      chatId: data.chatId,
      isTyping: data.isTyping,
    });
  }

  // ────────────── ADMIN EVENTS ──────────────

  /**
   * Admin joins admin room to receive notifications
   */
  @SubscribeMessage('adminJoin')
  handleAdminJoin(@ConnectedSocket() client: Socket) {
    client.join('admin_room');
    this.logger.log(`Admin ${client.id} joined admin_room`);
    return { event: 'adminJoined', data: { success: true } };
  }

  /**
   * Admin joins a specific chat room
   */
  @SubscribeMessage('adminJoinChat')
  handleAdminJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    client.join(`chat_${data.chatId}`);
    this.logger.log(`Admin ${client.id} joined chat_${data.chatId}`);
    return { event: 'adminJoinedChat', data: { chatId: data.chatId } };
  }

  /**
   * Admin sends message to user
   */
  @SubscribeMessage('adminSendMessage')
  async handleAdminMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      chatId: string;
      message: string;
      adminId: string;
      adminName: string;
    },
  ) {
    try {
      const result = await this.chatbotService.adminSendMessage(
        data.chatId,
        data.adminId,
        data.adminName,
        data.message,
      );

      // Broadcast to room (user will receive)
      this.server.to(`chat_${data.chatId}`).emit('newMessage', {
        chatId: data.chatId,
        message: result.message,
      });

      // Update admin sidebar
      this.server.to('admin_room').emit('chatUpdated', {
        chatId: data.chatId,
        lastMessage: data.message,
        lastMessageTime: new Date(),
      });

      return { event: 'messageSent', data: result };
    } catch (error) {
      this.logger.error('Error sending admin message:', error);
      client.emit('error', { message: 'Lỗi khi gửi tin nhắn admin' });
    }
  }

  /**
   * Admin takes over a chat
   */
  @SubscribeMessage('adminTakeover')
  async handleAdminTakeover(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      chatId: string;
      adminId: string;
      adminName: string;
      message?: string;
    },
  ) {
    try {
      await this.chatbotService.adminTakeover(
        data.chatId,
        data.adminId,
        data.adminName,
        data.message,
      );

      // Join the chat room
      client.join(`chat_${data.chatId}`);

      // Notify everyone in the room
      this.server.to(`chat_${data.chatId}`).emit('chatStatusChanged', {
        chatId: data.chatId,
        status: 'admin',
        adminName: data.adminName,
      });

      // Notify admin room
      this.server.to('admin_room').emit('chatUpdated', {
        chatId: data.chatId,
        status: 'admin',
        adminName: data.adminName,
      });

      return { event: 'takeoverSuccess', data: { chatId: data.chatId } };
    } catch (error) {
      this.logger.error('Error admin takeover:', error);
      client.emit('error', { message: 'Lỗi khi nhận chat' });
    }
  }

  /**
   * Admin releases chat back to bot
   */
  @SubscribeMessage('adminRelease')
  async handleAdminRelease(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      await this.chatbotService.adminReleaseToBot(data.chatId);

      // Notify everyone in the room
      this.server.to(`chat_${data.chatId}`).emit('chatStatusChanged', {
        chatId: data.chatId,
        status: 'bot',
      });

      // Notify admin room
      this.server.to('admin_room').emit('chatUpdated', {
        chatId: data.chatId,
        status: 'bot',
      });

      return { event: 'releaseSuccess', data: { chatId: data.chatId } };
    } catch (error) {
      this.logger.error('Error releasing chat:', error);
      client.emit('error', { message: 'Lỗi khi trả chat cho bot' });
    }
  }

  /**
   * Admin closes a chat
   */
  @SubscribeMessage('adminCloseChat')
  async handleAdminCloseChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; adminId: string; reason?: string },
  ) {
    try {
      await this.chatbotService.closeChat(
        data.chatId,
        data.adminId,
        data.reason,
      );

      // Notify everyone
      this.server.to(`chat_${data.chatId}`).emit('chatStatusChanged', {
        chatId: data.chatId,
        status: 'closed',
      });

      // Notify admin room
      this.server.to('admin_room').emit('chatUpdated', {
        chatId: data.chatId,
        status: 'closed',
      });

      return { event: 'chatClosed', data: { chatId: data.chatId } };
    } catch (error) {
      this.logger.error('Error closing chat:', error);
      client.emit('error', { message: 'Lỗi khi đóng chat' });
    }
  }

  /**
   * Admin typing indicator
   */
  @SubscribeMessage('adminTyping')
  handleAdminTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    client.to(`chat_${data.chatId}`).emit('adminTyping', {
      chatId: data.chatId,
      isTyping: data.isTyping,
    });
  }
}
