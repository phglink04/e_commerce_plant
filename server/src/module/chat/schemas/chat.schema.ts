import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

/**
 * Embedded message sub-document
 */
@Schema({ _id: false })
export class ChatMessage {
  @Prop({ required: true, enum: ["user", "bot", "admin", "system"] })
  sender!: "user" | "bot" | "admin" | "system";

  @Prop({ required: true })
  content!: string;

  @Prop({ default: () => new Date() })
  createdAt!: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

/**
 * Chat conversation document
 */
@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ default: "" })
  userName!: string;

  @Prop({ default: "" })
  userEmail!: string;

  @Prop({ required: true, enum: ["bot", "admin"], default: "bot" })
  status!: "bot" | "admin";

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages!: ChatMessage[];

  @Prop({ type: String, default: null })
  assignedAdminId!: string | null;

  @Prop({ default: "" })
  assignedAdminName!: string;

  @Prop({ default: false })
  isClosed!: boolean;

  @Prop({ default: 0 })
  unreadCount!: number;

  @Prop({ default: () => new Date() })
  lastMessageAt!: Date;
}

export type ChatDocument = HydratedDocument<Chat>;
export const ChatSchema = SchemaFactory.createForClass(Chat);
