import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Req } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import {
  CreateChatbotSessionDto,
  SendMessageDto,
  AdminTakeoverDto,
  AdminSendMessageDto,
  RequestAdminDto,
  CloseChatsDto,
} from './dto/chatbot-message.dto';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Chatbot } from './schemas/chatbot.schema';

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái hoạt động của chatbot' })
  @ApiResponse({
    status: 200,
    description: 'Trạng thái hoạt động của chatbot',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'online',
          description: 'Trạng thái của chatbot',
        },
        version: {
          type: 'string',
          example: '1.0.0',
          description: 'Phiên bản của chatbot',
        },
        apiProvider: {
          type: 'string',
          example: 'Google Gemini',
          description: 'Nhà cung cấp API AI',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-05-21T08:30:45.123Z',
          description: 'Thời gian kiểm tra',
        },
      },
    },
  })
  async getStatus() {
    return this.chatbotService.getStatus();
  }

  @Post('session/create')
  @ApiOperation({ summary: 'Tạo một phiên trò chuyện mới' })
  @ApiResponse({
    status: 201,
    description: 'Phiên trò chuyện được tạo thành công',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '60d5ec9af682fbd12a0b4b73' },
        userId: {
          type: 'string',
          example: '60d5ec9af682fbd12a0b4b72',
        },
        userName: { type: 'string', example: 'Nguyễn Văn A' },
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
        },
      },
    },
  })
  async createSession(
    @Body() createChatSessionDto: CreateChatbotSessionDto,
  ) {
    const session = await this.chatbotService.createChatSession(
      createChatSessionDto,
    );
    return {
      status: 'success',
      data: session,
    };
  }

  @Post('session/new')
  @ApiOperation({ summary: 'Tạo phiên trò chuyện mới (đóng session cũ nếu có)' })
  @ApiResponse({
    status: 201,
    description: 'Phiên trò chuyện mới được tạo, session cũ đã đóng',
  })
  async createNewSession(
    @Body() createChatSessionDto: CreateChatbotSessionDto,
  ) {
    const session = await this.chatbotService.createNewSession(
      createChatSessionDto,
    );
    return {
      status: 'success',
      data: session,
    };
  }

  @Post('message/send')
  @ApiOperation({ summary: 'Gửi tin nhắn đến chatbot' })
  @ApiResponse({
    status: 201,
    description: 'Tin nhắn được gửi và phản hồi được nhận',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '60d5ec9af682fbd12a0b4b73',
            },
            message: {
              type: 'string',
              example: 'Đây là phản hồi từ chatbot...',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
  })
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    const response = await this.chatbotService.sendMessage(sendMessageDto);
    return {
      status: 'success',
      data: response,
    };
  }

  @Get('history/:chatId')
  @ApiOperation({ summary: 'Lấy lịch sử trò chuyện' })
  @ApiParam({
    name: 'chatId',
    description: 'ID của cuộc trò chuyện',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  @ApiResponse({
    status: 200,
    description: 'Lịch sử trò chuyện',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            userName: { type: 'string' },
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['user', 'assistant'] },
                  content: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  async getChatHistory(@Param('chatId') chatId: string) {
    const chat = await this.chatbotService.getChatHistory(chatId);
    return {
      status: 'success',
      data: chat,
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Lấy tất cả cuộc trò chuyện của người dùng' })
  @ApiParam({
    name: 'userId',
    description: 'ID của người dùng',
    example: '60d5ec9af682fbd12a0b4b72',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách cuộc trò chuyện',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
      },
    },
  })
  async getUserChats(@Param('userId') userId: string) {
    const chats = await this.chatbotService.getUserChats(userId);
    return {
      status: 'success',
      data: chats,
    };
  }

  // ────────────── ADMIN ENDPOINTS ──────────────

  @Get('admin/active')
  @ApiOperation({ summary: 'Lấy danh sách chat hoạt động (Admin)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Danh sách chat hoạt động',
  })
  async getActiveChats() {
    const chats = await this.chatbotService.getActiveChats();
    return {
      status: 'success',
      data: chats,
    };
  }

  @Get('admin/pending')
  @ApiOperation({ summary: 'Lấy danh sách chat chờ xử lý (Admin)' })
  @ApiBearerAuth()
  async getPendingChats() {
    const chats = await this.chatbotService.getPendingChats();
    return {
      status: 'success',
      data: chats,
    };
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Lấy thống kê chatbot (Admin)' })
  @ApiBearerAuth()
  async getChatStats() {
    const stats = await this.chatbotService.getChatStats();
    return {
      status: 'success',
      data: stats,
    };
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Lấy tất cả chat sessions (Admin Dashboard)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Danh sách tất cả chat sessions',
  })
  async getAllChats(@Query('status') status?: string) {
    const chats = await this.chatbotService.getAllChats(status);
    return {
      status: 'success',
      data: chats,
    };
  }

  @Get('admin/:adminId')
  @ApiOperation({ summary: 'Lấy chat của admin (Admin)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'adminId',
    description: 'ID của admin',
  })
  async getAdminChats(@Param('adminId') adminId: string) {
    const chats = await this.chatbotService.getAdminChats(adminId);
    return {
      status: 'success',
      data: chats,
    };
  }

  @Post('admin/takeover')
  @ApiOperation({ summary: 'Admin nhận cuộc trò chuyện' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Chat đã được chuyển đến admin',
  })
  async adminTakeover(
    @Body() dto: AdminTakeoverDto,
    @Req() req: any,
  ) {
    const adminId = req.user?.id || '65beef0123456789abcdef02';
    const adminName = req.user?.name || 'Admin Support';

    const chat = await this.chatbotService.adminTakeover(
      dto.chatId,
      adminId,
      adminName,
      dto.message,
    );

    return {
      status: 'success',
      data: chat,
      message: 'Chat đã được chuyển đến admin',
    };
  }

  @Post('admin/release')
  @ApiOperation({ summary: 'Admin trả lại cuộc trò chuyện cho bot' })
  @ApiBearerAuth()
  async adminRelease(
    @Body() body: { chatId: string },
  ) {
    const chat = await this.chatbotService.adminReleaseToBot(body.chatId);

    return {
      status: 'success',
      data: chat,
      message: 'Chat đã được trả lại cho AI bot',
    };
  }

  @Post('admin/close')
  @ApiOperation({ summary: 'Đóng cuộc trò chuyện' })
  @ApiBearerAuth()
  async closeChat(
    @Body() dto: CloseChatsDto,
    @Req() req: any,
  ) {
    const closedBy = req.user?.id || '65beef0123456789abcdef02';

    const chat = await this.chatbotService.closeChat(
      dto.chatId,
      closedBy,
      dto.reason,
    );

    return {
      status: 'success',
      data: chat,
      message: 'Cuộc trò chuyện đã được đóng',
    };
  }

  @Post('request-admin')
  @ApiOperation({ summary: 'User yêu cầu chat với admin' })
  @ApiResponse({
    status: 201,
    description: 'Yêu cầu admin đã được gửi',
  })
  async requestAdmin(@Body() dto: RequestAdminDto) {
    const chat = await this.chatbotService.requestAdmin(dto.chatId);
    return {
      status: 'success',
      data: chat,
      message: 'Đã gửi yêu cầu hỗ trợ từ admin',
    };
  }

  @Post('admin/send-message')
  @ApiOperation({ summary: 'Admin gửi tin nhắn cho user' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Tin nhắn admin đã được gửi',
  })
  async adminSendMessage(
    @Body() dto: AdminSendMessageDto,
    @Req() req: any,
  ) {
    const adminId = dto.adminId || req.user?.id || '65beef0123456789abcdef02';
    const adminName = dto.adminName || req.user?.name || 'Admin Support';

    const result = await this.chatbotService.adminSendMessage(
      dto.chatId,
      adminId,
      adminName,
      dto.message,
    );

    return {
      status: 'success',
      data: result,
    };
  }

  @Delete('admin/:id')
  @ApiOperation({ summary: 'Admin xóa cuộc trò chuyện' })
  @ApiBearerAuth()
  async deleteChat(@Param('id') id: string) {
    return this.chatbotService.deleteChat(id);
  }
}

