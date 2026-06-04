import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MessageRole } from '../schemas/chatbot.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatbotMessageDto {
  @ApiProperty({
    enum: MessageRole,
    description: 'Vai trò của người gửi tin nhắn (user hoặc assistant)',
    example: 'user',
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(MessageRole)
  role: string = 'user';

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Tôi muốn biết loại cây nào thích hợp cho phòng tối',
  })
  @IsNotEmpty()
  @IsString()
  content: string = '';
}

export class CreateChatbotSessionDto {
  @ApiPropertyOptional({
    description: 'ID của người dùng (nếu đã đăng nhập)',
    example: '60d5ec9af682fbd12a0b4b72',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Tên của người dùng',
    example: 'Nguyễn Văn A',
  })
  @IsNotEmpty()
  @IsString()
  userName: string = '';
}

export class SendMessageDto {
  @ApiProperty({
    description: 'ID của cuộc trò chuyện',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  @IsNotEmpty()
  @IsString()
  chatId: string = '';

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Cây nào thích hợp cho phòng tối?',
  })
  @IsNotEmpty()
  @IsString()
  message: string = '';
}

export class ChatbotSessionDto {
  @ApiProperty({
    description: 'ID của cuộc trò chuyện',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  id: string = '';

  @ApiPropertyOptional({
    description: 'ID của người dùng',
    example: '60d5ec9af682fbd12a0b4b72',
  })
  userId?: string;

  @ApiProperty({
    description: 'Tên của người dùng',
    example: 'Nguyễn Văn A',
  })
  userName: string = '';

  @ApiProperty({
    description: 'Thời gian tạo',
  })
  createdAt: Date = new Date();

  @ApiProperty({
    description: 'Thời gian cập nhật lần cuối',
  })
  updatedAt: Date = new Date();
}

export class ChatbotResponseDto {
  @ApiProperty({
    description: 'ID của cuộc trò chuyện',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  id: string = '';

  @ApiProperty({
    description: 'Phản hồi từ chatbot',
    example: 'Cây pothos là lựa chọn tốt cho phòng tối...',
  })
  message: string = '';

  @ApiProperty({
    description: 'Thời gian phản hồi',
  })
  timestamp: Date = new Date();
}

export class AdminTakeoverDto {
  @ApiProperty({
    description: 'ID của cuộc trò chuyện',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  @IsNotEmpty()
  @IsString()
  chatId: string = '';

  @ApiPropertyOptional({
    description: 'Tin nhắn từ admin khi nhận cuộc trò chuyện',
    example: 'Xin chào, tôi là admin hỗ trợ. Tôi có thể giúp gì?',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class CloseChatsDto {
  @ApiProperty({
    description: 'ID của cuộc trò chuyện',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  @IsNotEmpty()
  @IsString()
  chatId: string = '';

  @ApiPropertyOptional({
    description: 'Lý do đóng cuộc trò chuyện',
    example: 'Vấn đề đã được giải quyết',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdminChatListDto {
  @ApiProperty({
    description: 'ID của cuộc trò chuyện',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  id: string = '';

  @ApiProperty({
    description: 'Tên khách hàng',
    example: 'Nguyễn Văn A',
  })
  userName: string = '';

  @ApiProperty({
    description: 'Trạng thái (bot, admin, closed)',
    enum: ['bot', 'admin', 'closed'],
  })
  status: string = '';

  @ApiProperty({
    description: 'Tin nhắn cuối cùng',
    example: 'Cây nào thích hợp cho phòng tối?',
  })
  lastMessage: string = '';

  @ApiProperty({
    description: 'Thời gian tin nhắn cuối cùng',
  })
  lastMessageTime: Date = new Date();

  @ApiPropertyOptional({
    description: 'Admin nhận cuộc trò chuyện',
    example: 'Admin Support',
  })
  assignedAdminName?: string;
}

export class AdminSendMessageDto {
  @ApiProperty({
    description: 'ID của cuộc trò chuyện',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  @IsNotEmpty()
  @IsString()
  chatId: string = '';

  @ApiProperty({
    description: 'Nội dung tin nhắn từ admin',
    example: 'Xin chào, tôi có thể giúp gì cho bạn?',
  })
  @IsNotEmpty()
  @IsString()
  message: string = '';

  @ApiPropertyOptional({
    description: 'ID của admin',
    example: '60d5ec9af682fbd12a0b4b72',
  })
  @IsOptional()
  @IsString()
  adminId?: string;

  @ApiPropertyOptional({
    description: 'Tên admin',
    example: 'Admin Support',
  })
  @IsOptional()
  @IsString()
  adminName?: string;
}

export class RequestAdminDto {
  @ApiProperty({
    description: 'ID của cuộc trò chuyện',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  @IsNotEmpty()
  @IsString()
  chatId: string = '';
}

export class AdminStatsDto {
  @ApiProperty({
    description: 'Tổng số cuộc trò chuyện',
    example: 150,
  })
  totalChats: number = 0;

  @ApiProperty({
    description: 'Số cuộc trò chuyện hoạt động',
    example: 5,
  })
  activeChats: number = 0;

  @ApiProperty({
    description: 'Số cuộc trò chuyện đã đóng',
    example: 145,
  })
  closedChats: number = 0;

  @ApiProperty({
    description: 'Số cuộc trò chuyện chờ admin',
    example: 3,
  })
  pendingChats: number = 0;

  @ApiProperty({
    description: 'Thời gian phản hồi trung bình (phút)',
    example: 2.5,
  })
  avgResponseTime: number = 0;
}
