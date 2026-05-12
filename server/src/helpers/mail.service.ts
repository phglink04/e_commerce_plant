import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>("SMTP_HOST");
    const port = Number(this.configService.get<string>("SMTP_PORT", "587"));
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASS");
    const secure =
      this.configService.get<string>("SMTP_SECURE", "false") === "true";

    this.fromEmail = this.configService.get<string>(
      "SMTP_FROM",
      user ?? "no-reply@plantworld.local",
    );

    if (!host || !user || !pass) {
      this.transporter = null;
      this.logger.warn(
        "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.",
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  async sendActivationCode(
    to: string,
    name: string,
    code: string,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: "PlantWorld - Account Activation Code",
      html: `
        <h2>Hello ${this.escapeHtml(name)},</h2>
        <p>Your activation code is:</p>
        <h1 style="letter-spacing: 2px;">${this.escapeHtml(code)}</h1>
        <p>This code is used to verify your account.</p>
      `,
    });
  }

  async sendResetPasswordLink(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: "PlantWorld - Reset Your Password",
      html: `
        <h2>Hello ${this.escapeHtml(name)},</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">
            Click here to reset your password
          </a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });
  }

  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    if (!this.transporter) {
      throw new InternalServerErrorException(
        "Email service is not configured. Please set SMTP environment variables.",
      );
    }

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      this.logger.error("Failed to send email", error as Error);
      throw new InternalServerErrorException(
        "Unable to send email at this time",
      );
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
