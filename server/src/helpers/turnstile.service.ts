import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
  error_messages?: string[];
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly secretKey: string | null;
  private readonly verifyUrl =
    "https://challenges.cloudflare.com/turnstile/v0/siteverify";

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>("TURNSTILE_SECRET_KEY");
    this.secretKey = key ?? null;

    if (!this.secretKey) {
      this.logger.warn("TURNSTILE_SECRET_KEY is not configured in environment");
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    // If secret key is not configured, skip verification in development
    if (!this.secretKey) {
      this.logger.warn(
        "Skipping Turnstile verification: TURNSTILE_SECRET_KEY not configured",
      );
      return true;
    }

    if (!token || token.trim().length === 0) {
      throw new BadRequestException("Turnstile token is required");
    }

    try {
      const response = await fetch(this.verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: this.secretKey,
          response: token,
        }),
      });

      if (!response.ok) {
        throw new BadRequestException(
          "Security verification service unavailable",
        );
      }

      const data = (await response.json()) as TurnstileVerifyResponse;

      if (!data.success) {
        this.logger.warn(
          `Turnstile verification failed: ${data.error_codes?.join(", ")}`,
        );
        throw new BadRequestException("Security verification failed");
      }

      this.logger.debug(
        `Turnstile verification successful for ${data.hostname}`,
      );
      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof Error) {
        this.logger.error(`Turnstile verification error: ${error.message}`);
      } else {
        this.logger.error(`Turnstile verification error: ${String(error)}`);
      }
      throw new BadRequestException("Security verification failed");
    }
  }

  async verifyTokenIfRequired(
    token: string | undefined,
    required: boolean = false,
  ): Promise<void> {
    if (required && !token) {
      throw new BadRequestException("Security verification is required");
    }

    if (token) {
      await this.verifyToken(token);
    }
  }
}
