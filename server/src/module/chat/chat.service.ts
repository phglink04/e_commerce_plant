import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Chat, ChatDocument, ChatMessage } from "./schemas/chat.schema";

/**
 * Chat Service
 * Handles conversation CRUD, AI bot responses, and admin takeover logic
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  // ─── CONVERSATION MANAGEMENT ────────────────────────────────────

  /**
   * Find or create a chat conversation for a user
   */
  async findOrCreateChat(
    userId: string,
    userName: string,
    userEmail: string,
  ): Promise<ChatDocument> {
    // Look for an open (not closed) chat for this user
    let chat = await this.chatModel.findOne({
      userId,
      isClosed: false,
    });

    if (!chat) {
      chat = await this.chatModel.create({
        userId,
        userName,
        userEmail,
        status: "bot",
        messages: [
          {
            sender: "bot",
            content:
              "🌿 Welcome to PlantWorld! I'm your plant assistant. How can I help you today? You can ask about our products, shipping, payments, or type \"talk to human\" to chat with our team.",
            createdAt: new Date(),
          },
        ],
        lastMessageAt: new Date(),
      });

      this.logger.log(`New chat created for user ${userId}`);
    }

    return chat;
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException("Chat not found");
    }
    return chat;
  }

  /**
   * Get all chats for a user
   */
  async getUserChats(userId: string): Promise<ChatDocument[]> {
    return this.chatModel
      .find({ userId })
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  /**
   * Get all active (non-closed) chats — for admin dashboard
   */
  async getActiveChats(): Promise<ChatDocument[]> {
    return this.chatModel
      .find({ isClosed: false })
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  /**
   * Close a chat conversation
   */
  async closeChat(chatId: string): Promise<ChatDocument> {
    const chat = await this.getChatById(chatId);
    chat.isClosed = true;
    chat.messages.push({
      sender: "system",
      content: "Chat has been closed.",
      createdAt: new Date(),
    });
    return chat.save();
  }

  // ─── MESSAGE HANDLING ───────────────────────────────────────────

  /**
   * Add a user message and generate bot response if in bot mode
   */
  async addUserMessage(
    chatId: string,
    content: string,
  ): Promise<{ chat: ChatDocument; botReply: ChatMessage | null }> {
    const chat = await this.getChatById(chatId);

    // Add user message
    const userMessage: ChatMessage = {
      sender: "user",
      content,
      createdAt: new Date(),
    };
    chat.messages.push(userMessage);
    chat.lastMessageAt = new Date();
    chat.unreadCount += 1;

    // Check for "talk to human" keyword trigger
    if (this.shouldEscalateToHuman(content)) {
      chat.status = "admin";
      const systemMsg: ChatMessage = {
        sender: "system",
        content:
          "You've been connected to our support queue. An admin will join shortly! 🙋",
        createdAt: new Date(),
      };
      chat.messages.push(systemMsg);
      await chat.save();
      return { chat, botReply: systemMsg };
    }

    // If in bot mode, generate AI response
    if (chat.status === "bot") {
      const botReply = this.generateBotResponse(content);
      chat.messages.push(botReply);
      chat.lastMessageAt = new Date();
      await chat.save();
      return { chat, botReply };
    }

    // If in admin mode, just save (admin will reply via WebSocket)
    await chat.save();
    return { chat, botReply: null };
  }

  /**
   * Add an admin message
   */
  async addAdminMessage(
    chatId: string,
    content: string,
    adminId: string,
    adminName: string,
  ): Promise<{ chat: ChatDocument; message: ChatMessage }> {
    const chat = await this.getChatById(chatId);

    const adminMessage: ChatMessage = {
      sender: "admin",
      content,
      createdAt: new Date(),
    };

    chat.messages.push(adminMessage);
    chat.lastMessageAt = new Date();
    chat.unreadCount = 0; // Admin read the messages
    await chat.save();

    return { chat, message: adminMessage };
  }

  // ─── ADMIN TAKEOVER ─────────────────────────────────────────────

  /**
   * Admin takes over a chat from the bot
   */
  async adminTakeover(
    chatId: string,
    adminId: string,
    adminName: string,
  ): Promise<ChatDocument> {
    const chat = await this.getChatById(chatId);
    chat.status = "admin";
    chat.assignedAdminId = adminId;
    chat.assignedAdminName = adminName;
    chat.unreadCount = 0;

    const systemMsg: ChatMessage = {
      sender: "system",
      content: `${adminName} has joined the chat. You're now speaking with our support team! 🎉`,
      createdAt: new Date(),
    };
    chat.messages.push(systemMsg);
    chat.lastMessageAt = new Date();

    await chat.save();
    this.logger.log(
      `Admin ${adminName} took over chat ${chatId}`,
    );
    return chat;
  }

  /**
   * Release chat back to bot mode
   */
  async releaseToBot(chatId: string): Promise<ChatDocument> {
    const chat = await this.getChatById(chatId);
    chat.status = "bot";
    chat.assignedAdminId = null;
    chat.assignedAdminName = "";

    const systemMsg: ChatMessage = {
      sender: "system",
      content:
        "You've been reconnected with our AI assistant. How can I help? 🌿",
      createdAt: new Date(),
    };
    chat.messages.push(systemMsg);
    chat.lastMessageAt = new Date();

    await chat.save();
    return chat;
  }

  /**
   * Reset unread count for a chat
   */
  async markAsRead(chatId: string): Promise<void> {
    await this.chatModel.findByIdAndUpdate(chatId, { unreadCount: 0 });
  }

  // ─── AI BOT LOGIC ──────────────────────────────────────────────

  /**
   * Check if user wants to talk to a human
   */
  private shouldEscalateToHuman(content: string): boolean {
    const triggers = [
      "talk to human",
      "talk to agent",
      "real person",
      "human please",
      "support agent",
      "speak to someone",
      "live chat",
      "customer support",
      "help me please",
      "nói chuyện với nhân viên",
      "hỗ trợ",
    ];
    const lower = content.toLowerCase();
    return triggers.some((t) => lower.includes(t));
  }

  /**
   * Generate AI bot response based on intent detection
   */
  private generateBotResponse(userMessage: string): ChatMessage {
    const intent = this.detectIntent(userMessage);
    const response = this.getResponseForIntent(intent, userMessage);

    return {
      sender: "bot",
      content: response,
      createdAt: new Date(),
    };
  }

  /**
   * Simple keyword-based intent detection
   */
  private detectIntent(
    message: string,
  ): "greeting" | "product" | "shipping" | "payment" | "order" | "care" | "fallback" {
    const lower = message.toLowerCase();

    // Greeting
    if (
      /^(hi|hello|hey|xin chào|chào|good morning|good evening|howdy)/i.test(lower)
    ) {
      return "greeting";
    }

    // Product search
    if (
      lower.includes("plant") ||
      lower.includes("flower") ||
      lower.includes("cây") ||
      lower.includes("product") ||
      lower.includes("recommend") ||
      lower.includes("indoor") ||
      lower.includes("outdoor") ||
      lower.includes("price") ||
      lower.includes("giá") ||
      lower.includes("buy") ||
      lower.includes("mua")
    ) {
      return "product";
    }

    // Shipping
    if (
      lower.includes("ship") ||
      lower.includes("delivery") ||
      lower.includes("deliver") ||
      lower.includes("giao hàng") ||
      lower.includes("track") ||
      lower.includes("shipping fee") ||
      lower.includes("phí ship")
    ) {
      return "shipping";
    }

    // Payment
    if (
      lower.includes("pay") ||
      lower.includes("payment") ||
      lower.includes("thanh toán") ||
      lower.includes("qr") ||
      lower.includes("bank") ||
      lower.includes("refund") ||
      lower.includes("hoàn tiền")
    ) {
      return "payment";
    }

    // Order
    if (
      lower.includes("order") ||
      lower.includes("đơn hàng") ||
      lower.includes("status") ||
      lower.includes("cancel") ||
      lower.includes("hủy")
    ) {
      return "order";
    }

    // Plant care
    if (
      lower.includes("care") ||
      lower.includes("water") ||
      lower.includes("sunlight") ||
      lower.includes("chăm sóc") ||
      lower.includes("tưới")
    ) {
      return "care";
    }

    return "fallback";
  }

  /**
   * Get response text for a detected intent
   */
  private getResponseForIntent(
    intent: string,
    _userMessage: string,
  ): string {
    const responses: Record<string, string[]> = {
      greeting: [
        "Hello! 🌿 Welcome to PlantWorld! How can I help you today?",
        "Hi there! 🌱 I'm your PlantWorld assistant. What are you looking for?",
        "Hey! 🌻 Great to see you! Need help finding the perfect plant?",
      ],
      product: [
        "🌿 We have a wonderful collection of indoor and outdoor plants! You can browse our catalog at the Shop page. Looking for something specific like succulents, tropical plants, or flowering plants?",
        "🪴 Check out our featured plants on the homepage! We carry everything from low-maintenance succulents to lush tropical varieties. Want me to help narrow down your options?",
        "🌱 Our plant collection includes Indoor favorites, Outdoor beauties, and seasonal specials. Is there a particular type of plant you're interested in?",
      ],
      shipping: [
        "📦 We offer nationwide shipping! Standard delivery takes 3-5 business days, and express delivery is 1-2 days. Shipping fees vary by location. You can check exact costs at checkout!",
        "🚚 All orders are carefully packaged to protect your plants during transit. Free shipping on orders over 500,000 VND! Track your order from your profile page.",
        "📬 We ship plants securely in custom-designed packaging. Delivery typically takes 3-5 business days. You can track your order status in the 'My Orders' section of your profile.",
      ],
      payment: [
        "💳 We accept QR bank transfers and cash on delivery (COD). After placing your order, you'll receive a QR code for easy payment. Refunds are processed within 3-5 business days.",
        "🏦 Payment options: QR Bank Transfer (instant) and COD. For QR payments, scan the code within 15 minutes. Having trouble with payment? Type 'talk to human' for immediate assistance.",
        "💰 We support QR code bank transfers and COD. Payments are verified automatically. Need help with a specific payment issue?",
      ],
      order: [
        "📋 You can check your order status in your Profile → My Orders section. Orders go through: Pending → Confirmed → Shipping → Delivered. Need help with a specific order?",
        "📦 To track your order, go to Profile → My Orders. You can filter by status. Want to cancel an order? Contact us and we'll help! Type 'talk to human' for order assistance.",
        "🔍 Your order history is available in your profile page. If you need help with a specific order, please share your order number or type 'talk to human' to speak with our team.",
      ],
      care: [
        "🌱 Plant care basics: Most indoor plants need indirect light, watering when the top inch of soil is dry, and moderate humidity. Each plant has specific needs — which plant are you caring for?",
        "💧 General plant care tips:\n• Water when top soil feels dry\n• Most plants prefer indirect sunlight\n• Use well-draining soil\n• Fertilize during growing season\nNeed care tips for a specific plant?",
        "🌿 Plant care varies by species! As a rule of thumb: don't overwater, provide appropriate light, and keep away from extreme temperatures. What plant would you like care advice for?",
      ],
      fallback: [
        "🤔 I'm not sure I understand. Could you rephrase that? I can help with:\n• 🌿 Product information\n• 📦 Shipping & delivery\n• 💳 Payment questions\n• 📋 Order tracking\n• 🌱 Plant care tips\n\nOr type **'talk to human'** to chat with our support team!",
        "😊 I didn't quite catch that! Here's what I can help with:\n• Finding plants\n• Shipping info\n• Payment help\n• Order status\n\nFor anything else, type **'talk to human'** and our team will assist you!",
      ],
    };

    const options = responses[intent] || responses.fallback;
    return options[Math.floor(Math.random() * options.length)];
  }
}
