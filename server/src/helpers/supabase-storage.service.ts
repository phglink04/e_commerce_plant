import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SupabaseClient, createClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly client: SupabaseClient | null;
  private readonly bucket: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const rawUrl = this.configService.get<string>("SUPABASE_URL");
    const url = this.normalizeSupabaseUrl(rawUrl);
    const key = this.configService.get<string>("SUPABASE_KEY")?.trim();
    this.bucket = this.configService.get<string>(
      "SUPABASE_BUCKET",
      "plantworld-images",
    );

    if (!url || !key) {
      this.enabled = false;
      this.client = null;
      this.logger.warn(
        "SUPABASE_URL or SUPABASE_KEY is missing/invalid. Upload endpoints will return an error until configured.",
      );
      return;
    }

    try {
      this.client = createClient(url, key);
      this.enabled = true;
    } catch {
      this.enabled = false;
      this.client = null;
      this.logger.warn(
        "Supabase client initialization failed. Check SUPABASE_URL and SUPABASE_KEY format.",
      );
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    if (!this.enabled || !this.client) {
      throw new BadRequestException(
        "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_KEY.",
      );
    }

    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${timestamp}-${safeName}`;

    this.logger.log(
      `Uploading to bucket="${this.bucket}", path="${path}", size=${file.size}, mime=${file.mimetype}`,
    );

    const { error, data: uploadData } = await this.client.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(
        `Supabase upload failed: ${error.message} | statusCode=${(error as any).statusCode ?? "N/A"}`,
      );
      throw new BadRequestException(
        `Upload thất bại: ${error.message}`,
      );
    }

    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    this.logger.log(`Upload success: ${data.publicUrl}`);
    return data.publicUrl;
  }

  private normalizeSupabaseUrl(rawUrl?: string): string | null {
    if (!rawUrl) {
      return null;
    }

    const trimmed = rawUrl.trim();
    if (!trimmed) {
      return null;
    }

    const extracted = trimmed.match(/https?:\/\/[^\s]+/i)?.[0] ?? trimmed;

    try {
      const parsed = new URL(extracted);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
      }
      return parsed.toString().replace(/\/$/, "");
    } catch {
      return null;
    }
  }
}
