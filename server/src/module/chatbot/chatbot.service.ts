import { Injectable, Logger, NotFoundException, Optional, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chatbot, ChatbotDocument, MessageRole } from './schemas/chatbot.schema';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ChatbotMessageDto,
  ChatbotResponseDto,
  ChatbotSessionDto,
  CreateChatbotSessionDto,
  SendMessageDto,
} from './dto/chatbot-message.dto';
import { PlantsService } from '../plants/plants.service';
import mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Plant } from '../plants/schemas/plant.schema';

@Injectable()
export class ChatbotService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private apiKey: string;
  private systemPrompt: string;
  private frontendUrl: string;
  private readonly logger = new Logger(ChatbotService.name);

  // Rate limiting — tránh spam API
  private lastApiCallTime = 0;
  private readonly MIN_API_INTERVAL_MS = 1500;

  // Embedding cache — tránh gọi lại embedding cho cùng query
  private embeddingCache = new Map<string, { values: number[]; ts: number }>();
  private readonly EMBEDDING_CACHE_TTL = 10 * 60 * 1000; // 10 phút

  // Danh sách model fallback — thử lần lượt khi 1 model hết quota
  private readonly FALLBACK_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
  ];

  constructor(
    @InjectModel(Chatbot.name) private chatbotModel: Model<ChatbotDocument>,
    @InjectModel(Plant.name) private plantModel: Model<Plant>,
    private plantsService: PlantsService,
    private configService: ConfigService,
  ) {
    // Khởi tạo Gemini API
    this.apiKey =
      this.configService.get<string>('GEMINI_API_KEY') || 'dummy-key';
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: this.FALLBACK_MODELS[0],
    });

    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.logger.log(`Gemini API initialized with model: ${this.FALLBACK_MODELS[0]}`);

    // Tạo system prompt cho trợ lý cây cảnh
    this.systemPrompt = `Bạn là "PlantBot" — trợ lý ảo thân thiện, nhiệt tình và am hiểu về cây cảnh của cửa hàng PlantWorld.
Hãy trả lời bằng tiếng Việt với giọng điệu vô cùng tự nhiên, lễ phép, ấm áp, sử dụng các từ ngữ thân thiện ở cuối câu (ví dụ: ạ, nhé, nha, nè, mình ơi,...).
Nhiệm vụ của bạn:
1. Chào hỏi và tạo thiện cảm với khách hàng. Gọi khách bằng tên nếu biết.
2. Tư vấn các loài cây cảnh phù hợp với nhu cầu, không gian (phòng ngủ, ban công, văn phòng...) và phong thủy của khách.
3. Hướng dẫn chi tiết cách chăm sóc cây (ánh sáng, tần suất tưới nước, loại đất trồng, bón phân).
4. Cung cấp thông tin giá cả, tình trạng kho hàng, chương trình ưu đãi dựa trên thông tin thực tế được cung cấp.
5. Giải đáp thắc mắc về chính sách vận chuyển, các hình thức thanh toán và chính sách đổi trả.
6. Nếu khách hàng muốn nói chuyện trực tiếp với nhân viên hoặc admin, hãy hướng dẫn họ nhấn nút "Chat với nhân viên" (biểu tượng 🛡️) ngay phía dưới khung chat.

QUAN TRỌNG: 
- Tuyệt đối không dùng định dạng Markdown (không dùng dấu sao *, dấu thăng #, ngoặc vuông [], hay code block \`\`\`).
- Chỉ trả lời bằng văn bản thuần (plain text), xuống dòng hợp lý bằng phím Enter để dễ đọc.
- Sử dụng các biểu tượng emoji phù hợp (🌿, 🌸, 💰, 🚚, 💳, 💡, 😊,...) để tin nhắn sinh động hơn.
- Khi cung cấp thông tin sản phẩm có kèm link ở phần ngữ cảnh, hãy đưa đường link đầy đủ ra để khách bấm vào (ví dụ: http://localhost:3000/plant/slug-id). Không bịa đặt đường link khác.`;
  }

  // ──────────────────── QUẢN LÝ PHIÊN TRÒNG CHUYỆN ─────────────────────

  async createChatSession(
    createChatbotSessionDto: CreateChatbotSessionDto,
  ) {
    const { userId, userName } = createChatbotSessionDto;

    // Tìm session đang mở của user (nếu đã đăng nhập)
    if (userId) {
      try {
        const existing = await this.chatbotModel.findOne({
          userId: new mongoose.Types.ObjectId(userId),
          isClosed: false,
        }).sort({ updatedAt: -1 });

        if (existing) {
          this.logger.log(`Reusing existing session ${existing._id} for user ${userId}`);
          return {
            id: existing._id.toString(),
            userId: userId,
            userName: existing.userName,
            messages: existing.messages || [],
            status: existing.status || 'bot',
            assignedAdminName: existing.assignedAdminName,
            createdAt: existing.createdAt || new Date(),
            updatedAt: existing.updatedAt || new Date(),
            isExisting: true,
          };
        }
      } catch (err) {
        this.logger.warn(`Error finding existing session: ${err}`);
      }
    }

    // Không có session cũ → tạo mới
    const newChat = new this.chatbotModel({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      userName: userName,
      messages: [],
      isActive: true,
    });

    const savedChat = await newChat.save();

    return {
      id: savedChat._id.toString(),
      userId: userId,
      userName: savedChat.userName,
      messages: [],
      status: 'bot' as const,
      createdAt: savedChat.createdAt || new Date(),
      updatedAt: savedChat.updatedAt || new Date(),
      isExisting: false,
    };
  }

  /**
   * Tạo session mới: đóng session cũ trước (nếu có), rồi tạo mới
   * Dùng khi user bấm "Bắt đầu cuộc trò chuyện mới"
   */
  async createNewSession(
    createChatbotSessionDto: CreateChatbotSessionDto,
  ) {
    const { userId, userName } = createChatbotSessionDto;

    // Đóng tất cả session cũ đang mở của user
    if (userId) {
      try {
        await this.chatbotModel.updateMany(
          {
            userId: new mongoose.Types.ObjectId(userId),
            isClosed: false,
          },
          {
            $set: {
              isClosed: true,
              status: 'closed',
              closedReason: 'Người dùng bắt đầu cuộc trò chuyện mới',
              updatedAt: new Date(),
            },
          },
        );
        this.logger.log(`Closed old sessions for user ${userId}`);
      } catch (err) {
        this.logger.warn(`Error closing old sessions: ${err}`);
      }
    }

    // Tạo session mới
    const newChat = new this.chatbotModel({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      userName: userName,
      messages: [],
      isActive: true,
    });

    const savedChat = await newChat.save();

    return {
      id: savedChat._id.toString(),
      userId: userId,
      userName: savedChat.userName,
      messages: [],
      status: 'bot' as const,
      createdAt: savedChat.createdAt || new Date(),
      updatedAt: savedChat.updatedAt || new Date(),
      isExisting: false,
    };
  }

  async sendMessage(sendMessageDto: SendMessageDto): Promise<ChatbotResponseDto> {
    const { chatId, message } = sendMessageDto;

    // Tìm đoạn chat theo ID
    const chat = await this.chatbotModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(
        `Không tìm thấy đoạn chat với ID ${chatId}`,
      );
    }

    // Thêm tin nhắn của người dùng
    chat.messages.push({
      role: MessageRole.USER,
      content: message,
      timestamp: new Date(),
    });

    // Lấy thông tin từ database để tạo context
    const context = await this.buildSmartContext(message);

    // Gửi tin nhắn đến Gemini API
    const response = await this.generateResponse(chat.messages, context, message, chat.userName);

    // Thêm phản hồi từ chatbot
    chat.messages.push({
      role: MessageRole.ASSISTANT,
      content: response,
      timestamp: new Date(),
    });

    // Cập nhật trạng thái chat
    chat.updatedAt = new Date();
    await chat.save();

    return {
      id: chat._id.toString(),
      message: response,
      timestamp: new Date(),
    };
  }

  async getChatHistory(chatId: string): Promise<Chatbot | null> {
    return this.chatbotModel.findById(chatId).exec();
  }

  async getUserChats(userId: string): Promise<Chatbot[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return this.chatbotModel
      .find({ userId: userObjectId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  // ──────────────────── SMART CONTEXT BUILDER ─────────────────────

  private async buildSmartContext(userMessage: string): Promise<string> {
    try {
      const topics = this.analyzeMessageTopic(userMessage);

      // Chào hỏi / general — không cần query DB
      if (topics.length === 1 && topics[0] === 'general' && userMessage.length < 25) {
        return '';
      }

      // Shipping / payment — chỉ cần policy, không cần sản phẩm
      if (topics.every(t => ['shipping', 'payment'].includes(t))) {
        return '';
      }

      // Có keyword rõ ràng → Text Search
      if (topics.some(t => ['pricing', 'availability', 'plant-query'].includes(t))) {
        const plants = await this.searchByText(userMessage, 5);
        if (plants.length > 0) return this.formatPlantsContext(plants, 'Sản phẩm liên quan');
      }

      // Semantic topics — thử text search trước để tiết kiệm API call embedding
      if (topics.some(t => ['recommendation', 'low-light', 'high-light', 'care', 'toxic', 'water', 'humidity'].includes(t))) {
        const textPlants = await this.searchByText(userMessage, 5);
        if (textPlants.length > 0) return this.formatPlantsContext(textPlants, 'Sản phẩm phù hợp');
        // Text search trống → thử semantic (cần embedding API call)
        const plants = await this.searchBySemantic(userMessage, 5);
        if (plants.length > 0) return this.formatPlantsContext(plants, 'Sản phẩm phù hợp');
      }

      // Fallback text search
      const plants = await this.searchByText(userMessage, 5);
      if (plants.length > 0) return this.formatPlantsContext(plants, 'Sản phẩm có thể liên quan');

      return '';
    } catch (error) {
      this.logger.error('Lỗi buildSmartContext:', error);
      return '';
    }
  }

  private async searchByText(query: string, limit = 5): Promise<Plant[]> {
    try {
      const stopwords = ['cây','con','cái','có','không','nào','gì','cho','của','và','là','tôi','bạn','ở','đâu','thế','này','kia','đó','được','phải','muốn','cần','hỏi','về','thì','mà','với','hay','hoặc','như','các','những','bao','nhiêu','giá','bán','mua','loại','loài','tìm','xem','biết','ơi','nhé','ạ','vậy','sao','lắm','rất','quá'];
      const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1 && !stopwords.includes(w));
      if (keywords.length === 0) return [];

      try {
        const textResults = await this.plantModel
          .find({ $text: { $search: keywords.join(' ') } }, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit).lean().exec();
        if (textResults.length > 0) {
          this.logger.debug(`Text search: ${textResults.length} results for "${keywords.join(' ')}"`);
          return textResults as Plant[];
        }
      } catch { this.logger.debug('$text fallback to regex'); }

      const regexPattern = keywords.join('|');
      return await this.plantModel.find({
        $or: [
          { name: { $regex: regexPattern, $options: 'i' } },
          { category: { $regex: regexPattern, $options: 'i' } },
          { tags: { $in: keywords.map(k => new RegExp(k, 'i')) } },
          { description: { $regex: regexPattern, $options: 'i' } },
        ],
      }).limit(limit).sort({ rating: -1 }).lean().exec() as Plant[];
    } catch (error) {
      this.logger.error('Lỗi searchByText:', error);
      return [];
    }
  }

  private async searchBySemantic(query: string, limit = 5): Promise<Plant[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding || queryEmbedding.length === 0) return this.searchByText(query, limit);

      // Thử Atlas Vector Search
      try {
        const results = await this.plantModel.aggregate([
          {
            $vectorSearch: {
              index: 'plant_vector_index', path: 'embedding',
              queryVector: queryEmbedding, numCandidates: limit * 10, limit,
            },
          },
          {
            $project: {
              name: 1, slug: 1, price: 1, category: 1, tags: 1,
              availability: 1, stock: 1, description: 1, rating: 1,
              discountPercentage: 1, score: { $meta: 'vectorSearchScore' },
            },
          },
        ]);
        if (results.length > 0) {
          this.logger.debug(`Vector Search: ${results.length} results`);
          return results as Plant[];
        }
      } catch (e: any) {
        this.logger.debug(`Vector Search unavailable: ${e?.message?.substring(0, 80)}`);
      }

      // Fallback: cosine similarity in-memory
      const plantsWithEmb = await this.plantModel.find({ embedding: { $exists: true, $ne: [] } }).lean().exec();
      if (plantsWithEmb.length === 0) return this.searchByText(query, limit);

      const scored = plantsWithEmb.map(p => ({
        plant: p, score: this.cosineSimilarity(queryEmbedding, (p as any).embedding || []),
      }));
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, limit).map(s => s.plant) as Plant[];
    } catch (error) {
      this.logger.error('Lỗi searchBySemantic:', error);
      return this.searchByText(query, limit);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Check cache trước
      const cacheKey = text.toLowerCase().trim().substring(0, 200);
      const cached = this.embeddingCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < this.EMBEDDING_CACHE_TTL) {
        this.logger.debug('Embedding cache HIT');
        return cached.values;
      }

      // Rate limiting
      await this.waitForRateLimit();

      // Fix: dùng đúng model text-embedding-004 trong URL (trước đây bị mismatch)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
        }),
      });

      this.lastApiCallTime = Date.now();

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errBody.substring(0, 200)}`);
      }

      const data = await response.json();
      const values = data?.embedding?.values || [];

      // Cache kết quả
      if (values.length > 0) {
        this.embeddingCache.set(cacheKey, { values, ts: Date.now() });
        // Dọn cache cũ nếu quá 100 entries
        if (this.embeddingCache.size > 100) {
          const now = Date.now();
          for (const [key, val] of this.embeddingCache) {
            if (now - val.ts > this.EMBEDDING_CACHE_TTL) this.embeddingCache.delete(key);
          }
        }
      }

      return values;
    } catch (error: any) {
      this.logger.error(`Lỗi embedding: ${error?.message?.substring(0, 150)}`);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0, nA = 0, nB = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; nA += a[i]*a[i]; nB += b[i]*b[i]; }
    const d = Math.sqrt(nA) * Math.sqrt(nB);
    return d === 0 ? 0 : dot / d;
  }

  /** Rate-limit helper: đợi nếu gọi API quá nhanh */
  private async waitForRateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastApiCallTime;
    if (elapsed < this.MIN_API_INTERVAL_MS) {
      const waitTime = this.MIN_API_INTERVAL_MS - elapsed;
      this.logger.debug(`Rate limit: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private formatPlantsContext(plants: Plant[], label: string): string {
    let ctx = `${label}:\n`;
    plants.forEach((p, i) => {
      ctx += `${i+1}. ${p.name} (${p.category})\n`;
      ctx += `   - Giá: ${p.price?.toLocaleString('vi-VN') || '?'}đ`;
      if (p.discountPercentage > 0) ctx += ` (Giảm ${p.discountPercentage}%)`;
      ctx += `\n   - Tình trạng: ${p.availability}`;
      if (p.description) ctx += `\n   - Mô tả: ${p.description}`;
      if (p.tags?.length > 0) ctx += `\n   - Đặc điểm: ${p.tags.join(', ')}`;
      ctx += `\n   - Link: ${this.buildProductLink(p)}`;
      ctx += '\n';
    });
    return ctx;
  }

  /** Tạo link sản phẩm frontend từ slug + _id */
  private buildProductLink(plant: any): string {
    const id = plant._id?.toString() || '';
    const slug = plant.slug || 'product';
    return `${this.frontendUrl}/plant/${slug}-${id}`;
  }

  /** Format thông tin chi tiết 1 cây cho fallback */
  private formatPlantDetailFallback(plant: any): string {
    const price = plant.price?.toLocaleString('vi-VN') || 'Liên hệ';
    const discount = plant.discountPercentage > 0 ? ` (giảm ${plant.discountPercentage}%)` : '';
    const status = plant.availability === 'In Stock' ? 'Còn hàng' : 
                   plant.availability === 'Out Of Stock' ? 'Hết hàng tạm thời' : 
                   plant.availability === 'Discontinued' ? 'Ngừng kinh doanh' : 'Sắp ra mắt';
    const link = this.buildProductLink(plant);

    let detail = `🌿 ${plant.name}\n`;
    detail += `💰 Giá: ${price}đ${discount}\n`;
    detail += `📦 Tình trạng: ${status}`;
    if (plant.stock > 0 && plant.availability === 'In Stock') detail += ` (còn ${plant.stock} sản phẩm)`;
    detail += '\n';
    if (plant.category) detail += `📂 Danh mục: ${plant.category}\n`;
    if (plant.tags?.length > 0) detail += `🏷️ Đặc điểm: ${plant.tags.join(', ')}\n`;
    if (plant.description) {
      const desc = plant.description.length > 120 
        ? plant.description.substring(0, 120) + '...' 
        : plant.description;
      detail += `📝 Mô tả: ${desc}\n`;
    }
    if (plant.rating > 0) detail += `⭐ Đánh giá: ${plant.rating}/5\n`;
    detail += `🔗 Xem chi tiết: ${link}\n`;
    return detail;
  }



  // ──────────────────── TẠO PHẢN HỒI TỪ GEMINI ─────────────────────

  private async generateResponse(
    messages: ChatbotMessageDto[],
    context: string,
    userMessage: string,
    userName?: string,
  ): Promise<string> {
    // Phân tích chủ đề tin nhắn
    const messageTopics = this.analyzeMessageTopic(userMessage);

    // Thử gọi Gemini API với fallback qua nhiều model
    for (let i = 0; i < this.FALLBACK_MODELS.length; i++) {
      const modelName = this.FALLBACK_MODELS[i];
      try {
        await this.waitForRateLimit();
        const result = await this.callGeminiAPI(modelName, messages, context, userMessage, messageTopics);
        this.lastApiCallTime = Date.now();
        return result;
      } catch (error: any) {
        const isQuotaError = error?.status === 429 ||
          error?.message?.includes('429') ||
          error?.message?.includes('quota') ||
          error?.message?.includes('Too Many Requests');

        this.logger.warn(
          `Model ${modelName} failed: ${isQuotaError ? 'QUOTA EXCEEDED' : error?.message?.substring(0, 100)}`,
        );

        // Nếu không phải lỗi quota, không cần thử model khác
        if (!isQuotaError) break;

        // Exponential backoff trước khi thử model tiếp theo
        if (i < this.FALLBACK_MODELS.length - 1) {
          const delay = Math.min(2000 * Math.pow(2, i), 8000);
          this.logger.debug(`Backoff: waiting ${delay}ms before next model`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Tất cả model đều fail → dùng fallback local
    this.logger.warn('All Gemini models failed — using local fallback response');
    return this.generateLocalFallback(userMessage, messageTopics, context, userName);
  }

  /**
   * Gọi Gemini API với 1 model cụ thể
   */
  private async callGeminiAPI(
    modelName: string,
    messages: ChatbotMessageDto[],
    context: string,
    userMessage: string,
    messageTopics: string[],
  ): Promise<string> {
    // Dùng systemInstruction thay vì gửi kèm prompt → tiết kiệm tokens đáng kể
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: this.systemPrompt,
    });

    // Chỉ lấy user/assistant messages cho history
    const validHistory = messages
      .slice(0, -1)
      .filter((msg) => msg.role === MessageRole.USER || msg.role === MessageRole.ASSISTANT)
      .map((msg) => ({
        role: msg.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    // Đảm bảo history bắt đầu bằng 'user' (yêu cầu Gemini)
    const history = validHistory.length > 0 && validHistory[0].role !== 'user'
      ? validHistory.slice(1)
      : validHistory;

    // Giới hạn history 6 tin nhắn gần nhất (giảm từ 10 để tiết kiệm tokens)
    const trimmedHistory = history.slice(-6);

    const chat = model.startChat({
      history: trimmedHistory,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 500, // Giảm từ 800 để tiết kiệm quota
      },
    });

    // Xây dựng prompt — KHÔNG cần system prompt vì đã dùng systemInstruction
    let prompt = '';
    if (context) {
      prompt += context + '\n';
    }
    prompt += `Khách hàng: ${userMessage}`;

    // Hướng dẫn ngắn theo chủ đề
    const topicGuides: Record<string, string> = {
      pricing: '\n→ Cung cấp giá từ danh sách sản phẩm.',
      availability: '\n→ Kiểm tra tình trạng hàng.',
      shipping: '\n→ Thông tin vận chuyển: miễn phí đơn từ 500K, giao 2-5 ngày.',
      care: '\n→ Hướng dẫn chăm sóc chi tiết (ánh sáng, nước, đất).',
      recommendation: '\n→ Hỏi nhu cầu rồi gợi ý sản phẩm phù hợp.',
    };
    for (const topic of messageTopics) {
      if (topicGuides[topic]) {
        prompt += topicGuides[topic];
        break;
      }
    }

    const result = await chat.sendMessage(prompt);
    return result.response.text();
  }

  // ──────────────────── FALLBACK KHI GEMINI API FAIL ─────────────────────

  /**
   * Trả lời local khi tất cả Gemini model đều fail (quota/network)
   */
  private async generateLocalFallback(
    userMessage: string,
    topics: string[],
    context: string,
    userName?: string,
  ): Promise<string> {
    const msg = userMessage.toLowerCase().trim();
    const uName = userName || 'mình';

    // ── Hỗ trợ từ Admin/Nhân viên ──
    if (topics.includes('admin-request')) {
      return `Dạ ${uName} ơi, nếu mình muốn trao đổi trực tiếp với nhân viên hỗ trợ, mình vui lòng nhấn nút "Chat với nhân viên" (biểu tượng 🛡️) ở thanh công cụ ngay phía dưới khung chat này nha. Nhân viên PlantWorld sẽ kết nối và hỗ trợ mình ngay ạ! 🌿`;
    }

    // ── Chào hỏi ──
    if (/^(xin chào|chào|hi|hello|hey|alo|helu|chào bạn|xin chao|helo|hi bạn|chào em|chào bot)/i.test(msg)) {
      return `Dạ em xin chào ${uName}! 🌿 Em là PlantBot — trợ lý cây cảnh của PlantWorld đây ạ.\n\nHôm nay em có thể giúp gì cho ${uName} thế nhỉ? Em có thể tư vấn chọn cây phù hợp không gian, hướng dẫn cách chăm sóc cây, hoặc giải đáp các thắc mắc về đặt hàng, phí ship nha! 😊`;
    }

    // ── Cảm ơn ──
    if (/^(cảm ơn|cám ơn|thanks|thank you|tks|cam on|cảm ơn nhiều|cám ơn nhiều)/i.test(msg)) {
      return `Dạ không có gì đâu ạ! Rất vui vì được hỗ trợ ${uName} ngày hôm nay. 🥰 Chúc ${uName} chăm cây thật vui và có một ngày tràn đầy năng lượng tươi xanh nha! 🌿 Nếu cần thêm thông tin gì, cứ nhắn em nhé!`;
    }

    // ── Tạm biệt ──
    if (/^(bye|tạm biệt|goodbye|tạm biệt nhé|hẹn gặp lại|tạm biệt nha|hẹn gặp lại nhé)/i.test(msg)) {
      return `Dạ em chào tạm biệt ${uName} nhé! 👋 Chúc ${uName} một ngày tốt lành và ngập tràn niềm vui. Hy vọng sớm được gặp lại ${uName} tại PlantWorld ạ! 🌿`;
    }

    // ── Hỏi giá ──
    if (topics.includes('pricing')) {
      const plants = await this.searchByText(userMessage, 4);
      if (plants.length > 0) {
        let reply = `💰 Dạ gửi ${uName} thông tin giá của các sản phẩm mình quan tâm ạ:\n\n`;
        plants.forEach((p) => {
          reply += this.formatPlantDetailFallback(p) + '\n';
        });
        reply += `Mình có thể bấm trực tiếp vào các đường link trên để xem hình ảnh thực tế và đặt mua cây nha! 🌿`;
        return reply;
      }
      return `Dạ hiện tại giá các loại cây tại PlantWorld dao động từ khoảng 50.000đ đến hơn 1.000.000đ tùy thuộc vào loại cây, kích thước chậu và kiểu dáng chậu ạ.\n\n${uName} có thể tham khảo trực tiếp bảng giá cập nhật mới nhất tại trang Cửa hàng của chúng em. Hoặc mình cho em xin tên loại cây cụ thể để em báo giá chính xác cho mình nhé! 🌿`;
    }

    // ── Tình trạng hàng ──
    if (topics.includes('availability')) {
      const plants = await this.searchByText(userMessage, 4);
      if (plants.length > 0) {
        let reply = `📦 Dạ em kiểm tra tình trạng hàng cho ${uName} rồi nè:\n\n`;
        plants.forEach((p) => {
          const status = p.availability === 'In Stock' ? `Còn hàng (còn ${p.stock} cây)` : 
                         p.availability === 'Out Of Stock' ? 'Tạm thời hết hàng' : 
                         p.availability === 'Discontinued' ? 'Đã ngừng kinh doanh' : 'Sắp ra mắt';
          reply += `• ${p.name}: ${status}\n  🔗 Xem tại: ${this.buildProductLink(p)}\n\n`;
        });
        reply += `Nếu cây mình thích đã hết hàng hoặc ngừng kinh doanh, em có thể gợi ý các loại cây tương tự khác cho mình nha!`;
        return reply;
      }
      return `Dạ hầu hết các mẫu cây cảnh trưng bày trên website của PlantWorld đều đang sẵn hàng tại tiệm ạ. Tuy nhiên, một số loại cây theo mùa có thể hết hàng nhanh.\n\n${uName} đang quan tâm loại cây nào thế ạ? Cho em xin tên để em kiểm tra kho hàng thực tế ngay cho mình nhé! 🌿`;
    }

    // ── Vận chuyển ──
    if (topics.includes('shipping')) {
      return `🚚 Dạ xin gửi ${uName} chính sách vận chuyển của PlantWorld để mình tham khảo nha:\n\n` +
        `• Đơn hàng từ 500.000đ: MIỄN PHÍ vận chuyển toàn quốc ạ!\n` +
        `• Đơn hàng dưới 500.000đ: Phí ship đồng giá chỉ 30.000đ.\n` +
        `• Thời gian nhận hàng: Khu vực nội thành từ 1 - 2 ngày, các tỉnh thành khác dao động từ 2 - 5 ngày làm việc.\n` +
        `• Cam kết đóng gói: Cây được bọc bầu đất kỹ càng, quấn xốp nổ chống sốc và đóng thùng carton cứng chịu lực cao, đảm bảo cây đến tay mình vẫn luôn tươi tắn, không bị gãy dập.\n` +
        `• Chính sách đổi trả: PlantWorld hỗ trợ 1 đổi 1 hoàn toàn miễn phí trong vòng 7 ngày đầu nếu cây bị lỗi, hư hỏng hoặc héo úa do quá trình vận chuyển nên mình hoàn toàn yên tâm nha! 🥰`;
    }

    // ── Thanh toán ──
    if (topics.includes('payment')) {
      return `💳 Dạ tại PlantWorld, tụi em hỗ trợ các hình thức thanh toán rất linh hoạt và bảo mật để mình dễ dàng lựa chọn ạ:\n\n` +
        `1. Thanh toán khi nhận hàng (COD): Mình nhận cây, kiểm tra tình trạng tươi khỏe rồi mới gửi tiền cho shipper.\n` +
        `2. Chuyển khoản ngân hàng (Banking): Chuyển khoản trực tiếp qua ứng dụng ngân hàng bằng quét mã QR tiện lợi.\n` +
        `3. Ví điện tử: Hỗ trợ thanh toán nhanh chóng qua ví Momo và ZaloPay.\n\n` +
        `Sau khi chọn xong cây, ${uName} chỉ cần click vào Giỏ hàng -> chọn Tiến hành thanh toán rồi chọn phương thức phù hợp là được nhé. Mình cần hỗ trợ đặt đơn không ạ?`;
    }

    // ── Chăm sóc cây ──
    if (topics.includes('care') || topics.includes('water') || topics.includes('humidity')) {
      const plants = await this.searchByText(userMessage, 2);
      let reply = `💡 Hướng dẫn chăm sóc cây cảnh cơ bản từ PlantWorld gửi ${uName} ạ:\n\n` +
        `• Ánh sáng: Phần lớn cây trồng trong nhà ưa ánh sáng tán xạ nhẹ (gần cửa sổ, ban công). Hãy tránh ánh nắng gắt trực tiếp buổi trưa để cây không bị cháy lá nha.\n` +
        `• Tưới nước: Nguyên tắc vàng là "chỉ tưới khi đất khô". Mình dùng tay hoặc que gỗ kiểm tra lớp đất sâu khoảng 2-3cm, nếu thấy khô hẳn thì hãy tưới đẫm nước nhé.\n` +
        `• Đất trồng & Chậu: Đất cần tơi xốp, thoát nước nhanh (pha thêm trấu hun hoặc đá perlite). Chậu cây bắt buộc phải có lỗ thoát nước ở đáy chậu.\n` +
        `• Bón phân: Định kỳ bón phân hữu cơ tan chậm hoặc phân NPK loãng khoảng 2 - 3 tuần/lần để cung cấp dinh dưỡng nuôi cây.\n`;
      
      if (plants.length > 0) {
        reply += `\n📌 Hướng dẫn cụ thể cho loại cây mình hỏi:\n\n`;
        plants.forEach((p) => {
          reply += `🌿 Cây ${p.name}:\n`;
          if (p.description) {
            reply += `  - ${p.description.substring(0, 150)}...\n`;
          }
          reply += `  - Đặc điểm nổi bật: ${p.tags?.join(', ') || 'Dễ chăm sóc'}\n`;
          reply += `  - Link chi tiết: ${this.buildProductLink(p)}\n\n`;
        });
      } else {
        reply += `\n${uName} có thể nhắn cho em tên loại cây cụ thể mình đang trồng để em gửi hướng dẫn chi tiết riêng cho loại cây đó nha! 🌿`;
      }
      return reply;
    }

    // ── Cây ít sáng / Trong nhà ──
    if (topics.includes('low-light')) {
      const plants = await this.plantModel.find({
        $or: [
          { tags: { $in: [/ít sáng/i, /trong nhà/i, /bóng râm/i, /phòng ngủ/i] } },
          { name: { $in: [/Lưỡi hổ/i, /Kim tiền/i, /Trầu bà/i, /Lan ý/i, /Kim ngân/i] } }
        ],
        availability: 'In Stock'
      }).limit(4).lean().exec() as Plant[];

      let reply = `🌱 Dạ ${uName} ơi, đây là danh sách các loại cây cực kỳ dễ sống, chịu bóng râm tốt và rất hợp để trong phòng ngủ, văn phòng hay những nơi thiếu ánh sáng tự nhiên ạ:\n\n`;
      if (plants.length > 0) {
        plants.forEach((p) => { reply += this.formatPlantDetailFallback(p) + '\n'; });
        reply += `Các dòng cây này vừa lọc không khí tốt lại vừa không tốn nhiều công chăm sóc, cực kỳ phù hợp cho người bận rộn đó ạ!`;
      } else {
        reply += `• Cây Lưỡi Hổ: Lọc bụi mịn, sản sinh oxy vào ban đêm.\n` +
          `• Cây Kim Tiền: Mang lại tài lộc, lá xanh mướt quanh năm.\n` +
          `• Cây Trầu Bà Thái: Sinh trưởng mạnh mẽ, thanh lọc chất độc hại.\n` +
          `• Cây Kim Ngân: Thu hút tiền tài, dáng thân xoắn rất đẹp.\n\n` +
          `Mình có thể ghé thăm trang Cửa hàng để chọn mẫu chậu xinh xắn nha!`;
      }
      return reply;
    }

    // ── Cây ưa nắng / Ban công ──
    if (topics.includes('high-light')) {
      const plants = await this.plantModel.find({
        $or: [
          { tags: { $in: [/ưa nắng/i, /ban công/i, /ngoài trời/i, /sân thượng/i] } },
          { name: { $in: [/Xương rồng/i, /Sen đá/i, /Trạng nguyên/i, /Hoa giấy/i] } }
        ],
        availability: 'In Stock'
      }).limit(4).lean().exec() as Plant[];

      let reply = `☀️ Dạ đối với khu vực ban công, sân thượng hoặc ngoài trời nhiều nắng, ${uName} tham khảo các dòng cây bền bỉ, chịu nhiệt và ưa nắng mạnh này nha:\n\n`;
      if (plants.length > 0) {
        plants.forEach((p) => { reply += this.formatPlantDetailFallback(p) + '\n'; });
        reply += `Những loại này khi được phơi nắng nhiều sẽ có màu sắc vô cùng rực rỡ và phát triển rất nhanh đó ạ!`;
      } else {
        reply += `• Cây Sen Đá & Xương Rồng: Đa dạng kiểu dáng, chịu hạn cực đỉnh.\n` +
          `• Cây Ngũ Gia Bì: Lá xanh xòe rộng, xua đuổi muỗi rất tốt.\n` +
          `• Cây Hoa Giấy: Leo giàn đẹp mắt, hoa nở rực rỡ quanh năm dưới nắng.\n\n` +
          `Mình muốn chọn chậu cây to hay chậu mini nhỏ xinh để đặt ngoài nắng thế ạ?`;
      }
      return reply;
    }

    // ── Thú cưng an toàn ──
    if (topics.includes('toxic')) {
      return `🐾 Dạ nếu nhà mình có nuôi các bé chó mèo tinh nghịch, ${uName} lưu ý lựa chọn cây an toàn để tránh trường hợp các bé gặm phải gây ngộ độc nha:\n\n` +
        `• Các dòng cây AN TOÀN cho thú cưng: Cây Nhện (Spider Plant), Cây Cau Tiểu Trâm, Cây Cỏ Đồng Tiền, Sen Đá (loại không gai), Cây Dương Xỉ.\n` +
        `• Các dòng cây CÓ ĐỘC nhẹ (nên để trên cao xa tầm với): Cây Kim Tiền, Cây Lưỡi Hổ, Vạn Niên Thanh, Trầu Bà (chứa tinh thể canxi oxalat có thể gây bỏng rát khoang miệng, nôn mửa nếu nuốt phải).\n\n` +
        `${uName} định mua cây nào chưa ạ? Nhắn tên để em check tính an toàn cho bé cưng nhà mình nhé!`;
    }

    // ── Tư vấn / Gợi ý sản phẩm ──
    if (topics.includes('recommendation')) {
      const plants = await this.searchByText(userMessage, 4);
      if (plants.length > 0) {
        let reply = `🌿 Dạ em tìm được một số cây rất phù hợp với mô tả của ${uName} đây ạ:\n\n`;
        plants.forEach((p) => { reply += this.formatPlantDetailFallback(p) + '\n'; });
        reply += `Mình xem thử có ưng ý mẫu nào không nha!`;
        return reply;
      }
      // Gợi ý mặc định
      const featured = await this.plantModel.find({ isFeatured: true, availability: 'In Stock' }).limit(3).lean().exec() as Plant[];
      let reply = `🌿 Dạ nếu ${uName} chưa biết chọn cây nào, em xin gợi ý 3 loại cây cảnh bán chạy nhất, siêu dễ trồng và mang ý nghĩa phong thủy cực tốt tại PlantWorld nha:\n\n`;
      if (featured.length > 0) {
        featured.forEach((p) => { reply += this.formatPlantDetailFallback(p) + '\n'; });
      } else {
        reply += `1. Cây Kim Tiền (Giá khoảng 120k - 250k): Thân lá mập mạp, biểu tượng cho tiền tài, cực dễ sống trong nhà.\n` +
          `2. Cây Lưỡi Hổ (Giá khoảng 90k - 180k): Lọc không khí đỉnh cao, sống khỏe ngay cả khi bạn quên tưới nước cả tháng.\n` +
          `3. Cây Cau Tiểu Trâm (Giá khoảng 80k - 150k): Dáng lá mảnh mai như dừa mini, đem lại cảm giác tươi mát và xua đuổi tà khí.\n\n`;
      }
      reply += `Không biết mình muốn tìm cây đặt ở vị trí nào để em tư vấn sát nhất cho mình ạ?`;
      return reply;
    }

    // ── Hỏi cây cụ thể / Tra cứu sản phẩm ──
    if (topics.includes('plant-query')) {
      const plants = await this.searchByText(userMessage, 4);
      if (plants.length > 0) {
        const bestMatch = plants[0];
        const nameWords = bestMatch.name?.toLowerCase().split(/\s+/) || [];
        const msgWords = msg.split(/\s+/);
        const isExactMatch = plants.length === 1 || nameWords.some(w => msgWords.includes(w) && w.length > 2);

        if (isExactMatch) {
          let reply = `📋 Dạ em gửi thông tin chi tiết về cây **${bestMatch.name}** mình đang quan tâm ạ:\n\n`;
          reply += this.formatPlantDetailFallback(bestMatch);
          if (plants.length > 1) {
            reply += `\n📌 Ngoài ra còn các sản phẩm tương tự có thể mình cũng thích:\n\n`;
            plants.slice(1, 4).forEach((p) => {
              const price = p.price?.toLocaleString('vi-VN') || 'Liên hệ';
              reply += `• ${p.name} — giá chỉ ${price}đ\n  🔗 Xem thêm: ${this.buildProductLink(p)}\n\n`;
            });
          }
          reply += `Mình có cần em hướng dẫn thêm về cách chăm sóc cây ${bestMatch.name} này không ạ?`;
          return reply;
        }

        let reply = `🌿 Dạ em tìm thấy các sản phẩm liên quan đến yêu cầu của mình nè:\n\n`;
        plants.forEach((p) => { reply += this.formatPlantDetailFallback(p) + '\n'; });
        reply += `Mình click vào đường link của cây để xem thêm thông tin chi tiết nha!`;
        return reply;
      }
    }

    // ── Mặc định khi không bắt được gì ──
    const fallbackPlants = await this.searchByText(userMessage, 3);
    if (fallbackPlants.length > 0) {
      let reply = `Dạ cảm ơn ${uName} đã nhắn tin cho PlantWorld! 🌿\n\nEm tìm thấy một số cây có thể liên quan đến câu hỏi của mình ạ:\n\n`;
      fallbackPlants.forEach((p) => { reply += this.formatPlantDetailFallback(p) + '\n'; });
      reply += `Không biết mình đang muốn tìm hiểu kỹ hơn về thông tin gì (giá cả, cách chăm sóc hay đặt mua) của các cây trên thế ạ?`;
      return reply;
    }

    return `Dạ cảm ơn ${uName} đã nhắn tin cho PlantWorld! 🌿\n\nVì hiện tại hệ thống AI đang bận nên em xin phép phản hồi nhanh cho mình ạ. Em có thể hỗ trợ mình giải đáp các vấn đề sau:\n\n` +
      `• 🌱 Gợi ý cây cảnh hợp không gian, phong thủy\n` +
      `• 💡 Hướng dẫn chăm sóc cây bị héo, vàng lá, cách tưới nước\n` +
      `• 🚚 Tra cứu phí ship, thời gian giao hàng\n` +
      `• 💳 Hỗ trợ phương thức thanh toán\n\n` +
      `Nếu ${uName} muốn trò chuyện trực tiếp với nhân viên tư vấn, mình hãy nhấn nút 🛡️ Chat với nhân viên ở phía bên dưới nha. Cửa hàng luôn sẵn lòng hỗ trợ mình ạ!`;
  }

  // ──────────────────── PHÂN TÍCH TIN NHẮN ─────────────────────

  private analyzeMessageTopic(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const topics: string[] = [];

    const keywordMap: { [key: string]: string } = {
      'admin|nhân viên|nhân viên hỗ trợ|gặp người|chat với người|gặp admin|nhan vien|ho tro|người hỗ trợ': 'admin-request',
      'giá|bao nhiêu|cost|price|giá bao|giá cả|rẻ|đắt|tiền': 'pricing',
      'còn hàng|stock|tình trạng|available|hết hàng|còn không': 'availability',
      'vận chuyển|ship|giao hàng|delivery|shipping|giao|freeship': 'shipping',
      'thanh toán|payment|trả tiền|cod|chuyển khoản|qr': 'payment',
      'chăm sóc|care|cách trồng|cách tưới|bón phân|sâu bệnh|vàng lá|héo|rụng lá': 'care',
      'độc|toxic|pet|thú cưng|an toàn': 'toxic',
      'phòng tối|ánh sáng yếu|low light|bóng mát|trong nhà|phòng ngủ|văn phòng': 'low-light',
      'ánh sáng mạnh|sun|nắng|direct light|ban công|ngoài trời|sân thượng': 'high-light',
      'tư vấn|gợi ý|suggest|recommend|nên mua|phù hợp|thích hợp|hợp|đề xuất': 'recommendation',
      'tưới|watering|tưới nước|bao lâu tưới': 'water',
      'độ ẩm|humidity|ẩm|phun sương': 'humidity',
    };

    for (const [keywords, topic] of Object.entries(keywordMap)) {
      const regex = new RegExp(keywords, 'i');
      if (regex.test(lowerMessage)) {
        topics.push(topic);
      }
    }

    // Nếu chưa khớp topic nào nhưng nhắc đến cây/sản phẩm → đánh dấu plant-query
    if (topics.length === 0) {
      const plantKeywords = /cây|plant|lá|hoa|sen|trầu|kim tiền|phát tài|lưỡi hổ|xương rồng|monstera|pothos|succulent|cảnh|trồng|mua|bán|sản phẩm|loại|loài/i;
      if (plantKeywords.test(lowerMessage)) {
        topics.push('plant-query');
      }
    }

    return topics.length > 0 ? topics : ['general'];
  }



  // ──────────────────── QUẢN LÝ ADMIN HANDOFF ─────────────────────

  async adminTakeover(
    chatId: string,
    adminId: string,
    adminName: string,
    initialMessage?: string,
  ) {
    const chat = await this.chatbotModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Không tìm thấy chat ${chatId}`);
    }

    // Cập nhật status thành admin
    chat.status = 'admin';
    chat.assignedAdminId = new mongoose.Types.ObjectId(adminId);
    chat.assignedAdminName = adminName;

    // Thêm thông báo hệ thống
    chat.messages.push({
      role: MessageRole.ASSISTANT,
      content: `[Chuyển tiếp đến admin] ${adminName} đã nhận cuộc trò chuyện của bạn.`,
      timestamp: new Date(),
    });

    // Nếu admin có tin nhắn đầu tiên
    if (initialMessage) {
      chat.messages.push({
        role: MessageRole.ASSISTANT,
        content: initialMessage,
        timestamp: new Date(),
      });
    }

    chat.updatedAt = new Date();
    return chat.save();
  }

  async adminReleaseToBot(chatId: string) {
    const chat = await this.chatbotModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Không tìm thấy chat ${chatId}`);
    }

    // Cập nhật status thành bot
    chat.status = 'bot';
    chat.assignedAdminName = '';

    // Thêm thông báo hệ thống
    chat.messages.push({
      role: MessageRole.ASSISTANT,
      content: `[Chuyển tiếp] Cuộc trò chuyện đã được chuyển trở lại cho AI chatbot.`,
      timestamp: new Date(),
    });

    chat.updatedAt = new Date();
    return chat.save();
  }

  async closeChat(
    chatId: string,
    closedBy: string,
    reason?: string,
  ) {
    const chat = await this.chatbotModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Không tìm thấy chat ${chatId}`);
    }

    chat.status = 'closed';
    chat.isClosed = true;
    chat.closedReason = reason || 'Cuộc trò chuyện đã kết thúc';
    chat.closedBy = new mongoose.Types.ObjectId(closedBy);

    // Thêm thông báo hệ thống
    chat.messages.push({
      role: MessageRole.ASSISTANT,
      content: `[Đóng cuộc trò chuyện] ${reason || 'Cảm ơn bạn đã liên hệ PlantWorld'}`,
      timestamp: new Date(),
    });

    chat.updatedAt = new Date();
    return chat.save();
  }

  async getActiveChats(status?: 'bot' | 'admin') {
    const query: any = { isClosed: false };
    if (status) {
      query.status = status;
    }

    return this.chatbotModel
      .find(query)
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getPendingChats() {
    return this.chatbotModel
      .find({
        status: 'bot',
        isClosed: false,
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getAdminChats(adminId: string) {
    return this.chatbotModel
      .find({
        assignedAdminId: new mongoose.Types.ObjectId(adminId),
        isClosed: false,
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getChatStats() {
    const totalChats = await this.chatbotModel.countDocuments();
    const activeChats = await this.chatbotModel.countDocuments({
      isClosed: false,
    });
    const closedChats = await this.chatbotModel.countDocuments({
      isClosed: true,
    });
    const pendingChats = await this.chatbotModel.countDocuments({
      status: 'pending',
      isClosed: false,
    });
    const adminChats = await this.chatbotModel.countDocuments({
      status: 'admin',
      isClosed: false,
    });

    // Tính avgResponseTime từ dữ liệu thực
    let avgResponseTime = 0;
    try {
      const chatsWithAdminReply = await this.chatbotModel
        .find({ status: { $in: ['admin', 'closed'] }, assignedAdminId: { $exists: true } })
        .limit(100)
        .exec();

      if (chatsWithAdminReply.length > 0) {
        const responseTimes: number[] = [];
        for (const chat of chatsWithAdminReply) {
          const firstUserMsg = chat.messages.find(m => m.role === MessageRole.USER);
          const firstAdminMsg = chat.messages.find(
            m => m.role === MessageRole.ADMIN || m.role === MessageRole.ASSISTANT,
          );
          if (firstUserMsg && firstAdminMsg && firstAdminMsg.timestamp > firstUserMsg.timestamp) {
            const diffMs = new Date(firstAdminMsg.timestamp).getTime() - new Date(firstUserMsg.timestamp).getTime();
            responseTimes.push(diffMs / 60000); // convert to minutes
          }
        }
        if (responseTimes.length > 0) {
          avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
          avgResponseTime = Math.round(avgResponseTime * 10) / 10;
        }
      }
    } catch (err) {
      this.logger.error('Lỗi khi tính avgResponseTime:', err);
    }

    return {
      totalChats,
      activeChats,
      closedChats,
      pendingChats,
      adminChats,
      avgResponseTime,
    };
  }

  async getClosedChats() {
    return this.chatbotModel
      .find({ isClosed: true })
      .sort({ updatedAt: -1 })
      .exec();
  }



  // ──────────────────── ADMIN GỬI TIN NHẮN ─────────────────────

  async adminSendMessage(
    chatId: string,
    adminId: string,
    adminName: string,
    message: string,
  ) {
    const chat = await this.chatbotModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Không tìm thấy chat ${chatId}`);
    }

    // Thêm tin nhắn admin
    chat.messages.push({
      role: MessageRole.ADMIN,
      content: message,
      timestamp: new Date(),
    });

    chat.updatedAt = new Date();
    const saved = await chat.save();

    return {
      chatId: saved._id.toString(),
      message: {
        role: MessageRole.ADMIN,
        content: message,
        timestamp: new Date(),
        adminName,
      },
    };
  }

  // ──────────────────── YÊU CẦU CHAT ADMIN ─────────────────────

  async requestAdmin(chatId: string) {
    const chat = await this.chatbotModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Không tìm thấy chat ${chatId}`);
    }

    chat.status = 'pending';

    // Thêm thông báo hệ thống
    chat.messages.push({
      role: MessageRole.SYSTEM,
      content: 'Bạn đã yêu cầu hỗ trợ từ nhân viên. Vui lòng chờ trong giây lát...',
      timestamp: new Date(),
    });

    chat.updatedAt = new Date();
    return chat.save();
  }

  // ──────────────────── LẤY TẤT CẢ CHATS (ADMIN DASHBOARD) ─────────────────────

  async getAllChats(status?: string) {
    const query: any = {};
    if (status && status !== 'all') {
      if (status === 'active') {
        query.isClosed = false;
      } else if (status === 'closed') {
        query.isClosed = true;
      } else {
        query.status = status;
        query.isClosed = false;
      }
    }

    // Tối ưu: chỉ trả message cuối cùng cho sidebar preview
    // Admin sẽ load full messages khi click vào chat (getChatHistory)
    return this.chatbotModel
      .find(query)
      .select({
        userId: 1,
        userName: 1,
        status: 1,
        isClosed: 1,
        assignedAdminName: 1,
        createdAt: 1,
        updatedAt: 1,
        messages: { $slice: -1 },
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  // ──────────────────── KIỂM TRA TRẠNG THÁI ─────────────────────

  async getStatus() {
    return {
      status: 'online',
      version: '1.0.0',
      apiProvider: 'Google Gemini',
      timestamp: new Date().toISOString(),
    };
  }

  async deleteChat(chatId: string) {
    const chat = await this.chatbotModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Không tìm thấy chat với ID ${chatId}`);
    }
    await this.chatbotModel.findByIdAndDelete(chatId);
    return { success: true, message: `Đã xóa cuộc trò chuyện ${chatId}` };
  }
}
