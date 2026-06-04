import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ChatbotDocument = HydratedDocument<Chatbot>;

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

@Schema({ _id: false })
export class ChatbotMessage {
  @ApiProperty({
    enum: MessageRole,
    description: 'Vai trò của người gửi tin nhắn',
    example: 'user',
  })
  @Prop({ required: true, enum: Object.values(MessageRole) })
  role: string = 'user';

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Tôi muốn biết loại cây nào thích hợp cho phòng tối',
  })
  @Prop({ required: true })
  content: string = '';

  @ApiProperty({
    description: 'Thời gian gửi tin nhắn',
    example: '2024-05-21T08:30:30.123Z',
  })
  @Prop({ default: Date.now })
  timestamp: Date = new Date();
}

@Schema({ timestamps: true })
export class Chatbot {
  @ApiPropertyOptional({
    description: 'ID của người dùng (nếu đã đăng nhập)',
    type: String,
    example: '60d5ec9af682fbd12a0b4b72',
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  userId?: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Tên của người dùng hoặc khách',
    example: 'Nguyễn Văn A',
  })
  @Prop({ required: true })
  userName: string = '';

  @ApiProperty({
    description: 'Danh sách các tin nhắn trong cuộc trò chuyện',
  })
  @Prop({ type: [SchemaFactory.createForClass(ChatbotMessage)], default: [] })
  messages: ChatbotMessage[] = [];

  @ApiProperty({
    description: 'Trạng thái của cuộc trò chuyện (bot, admin, pending, closed)',
    enum: ['bot', 'admin', 'pending', 'closed'],
    example: 'bot',
  })
  @Prop({ 
    default: 'bot', 
    enum: ['bot', 'admin', 'pending', 'closed'],
    index: true 
  })
  status: 'bot' | 'admin' | 'pending' | 'closed' = 'bot';

  @ApiPropertyOptional({
    description: 'ID của admin nhận cuộc trao đổi',
    type: String,
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  assignedAdminId?: mongoose.Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Tên admin nhận cuộc trao đổi',
    example: 'Admin Support',
  })
  @Prop({ default: '' })
  assignedAdminName?: string;

  @ApiProperty({
    description: 'Trạng thái đóng cuộc trò chuyện',
    example: false,
  })
  @Prop({ default: false })
  isClosed: boolean = false;

  @ApiPropertyOptional({
    description: 'Lý do đóng cuộc trò chuyện',
    example: 'Vấn đề đã được giải quyết',
  })
  @Prop({ default: '' })
  closedReason?: string;

  @ApiPropertyOptional({
    description: 'Admin đóng cuộc trò chuyện',
    type: String,
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  closedBy?: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Thời gian tạo cuộc trò chuyện',
  })
  @Prop({ default: Date.now })
  createdAt: Date = new Date();

  @ApiProperty({
    description: 'Thời gian cập nhật lần cuối',
  })
  @Prop({ default: Date.now })
  updatedAt: Date = new Date();

  @ApiProperty({
    description: 'Session đang hoạt động',
    default: true,
  })
  @Prop({ default: true })
  isActive: boolean = true;
}

export const ChatbotSchema = SchemaFactory.createForClass(Chatbot);
