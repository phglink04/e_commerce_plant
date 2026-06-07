import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import * as QRCode from "qrcode";
import * as speakeasy from "speakeasy";
import { UsersService } from "../module/users/users.service";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyAccountDto } from "./dto/verify-account.dto";
import { SendActivationDto } from "./dto/send-activation.dto";
import { MailService } from "../helpers/mail.service";
import { TurnstileService } from "../helpers/turnstile.service";
import { StoredUser } from "../module/users/types/user.type";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { Authenticate2faDto } from "./dto/2fa/authenticate-2fa.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly turnstileService: TurnstileService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<StoredUser | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const passwordMatched = await compare(password, user.passwordHash);
    if (!passwordMatched) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Your account has been disabled");
    }

    return user;
  }

  async signup(dto: SignupDto) {
    if (dto.password !== dto.passwordConfirm) {
      throw new BadRequestException("Password confirm does not match");
    }

    // Verify Turnstile token if provided
    const isProduction = process.env.NODE_ENV === "production";
    await this.turnstileService.verifyTokenIfRequired(
      dto.captchaToken,
      isProduction,
    );

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException("Email already exists");
    }

    const passwordHash = await hash(dto.password, 10);
    const verificationCode = this.generateNumericCode();
    const verificationCodeExpiresAt = new Date(
      Date.now() + 1000 * 60 * 60,
    ).toISOString();
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      verificationCode,
      verificationCodeExpiresAt,
    });

    let mailSent = true;
    try {
      await this.mailService.sendActivationCode(
        user.email,
        user.name,
        verificationCode,
      );
    } catch (error) {
      mailSent = false;
      this.logger.warn(
        `Activation email failed for ${user.email}. User was created and can request resend.`,
      );
      this.logger.debug(String(error));
    }

    return {
      message: mailSent
        ? "Registration successful. Please verify your account."
        : "Registration successful, but we could not send verification email. Please use resend activation code.",
      data: {
        user: this.usersService.toPublicUser(user),
        ...(mailSent ? {} : { mailSent: false }),
      },
    };
  }

  login(user: StoredUser, isTwoFactorAuthenticated = false) {
    if (user.isTwoFactorEnabled && !isTwoFactorAuthenticated) {
      return {
        message: "Two-factor authentication required",
        requiresTwoFactor: true,
        userId: user.id,
      };
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        "Please verify your account first. Use activation code sent at registration.",
      );
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      accountType: user.accountType,
      role: user.role,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });

    return {
      message: "Login successful",
      token: accessToken,
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: process.env.JWT_EXPIRES_IN ?? "7d",
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      avatar: user.avatar,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      data: {
        user: this.usersService.toPublicUser(user),
      },
    };
  }

  async sendActivation(dto: SendActivationDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException("Email does not exist");
    }

    if (user.isVerified) {
      throw new BadRequestException("Account is already activated");
    }

    const now = new Date();
    const verificationCode =
      user.verificationCode &&
      user.verificationCodeExpiresAt &&
      new Date(user.verificationCodeExpiresAt) > now
        ? user.verificationCode
        : this.generateNumericCode();

    user.verificationCode = verificationCode;
    user.verificationCodeExpiresAt = new Date(
      Date.now() + 1000 * 60 * 60,
    ).toISOString();
    user.updatedAt = new Date().toISOString();
    await this.usersService.update(user);

    await this.mailService.sendActivationCode(
      user.email,
      user.name,
      verificationCode,
    );

    return {
      message: "Activation code sent successfully",
      data: {},
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException("Email does not exist");
    }

    const resetToken = randomBytes(20).toString("hex");
    const resetTokenExpiresAt = new Date(
      Date.now() + 1000 * 60 * 60,
    ).toISOString();

    user.resetToken = resetToken;
    user.resetTokenExpiresAt = resetTokenExpiresAt;
    user.updatedAt = new Date().toISOString();
    await this.usersService.update(user);

    const resetUrl = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;
    await this.mailService.sendResetPasswordLink(
      user.email,
      user.name,
      resetUrl,
    );

    return {
      message: "Reset link sent. Check your email.",
      data: {
        ...(this.shouldExposeDebugTokens() ? { resetToken } : {}),
        ...(this.shouldExposeDebugTokens() ? { resetUrl } : {}),
      },
    };
  }

  async resetPassword(token: string, dto: ResetPasswordDto) {
    if (dto.password !== dto.passwordConfirm) {
      throw new BadRequestException("Password confirm does not match");
    }

    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    if (
      !user.resetTokenExpiresAt ||
      new Date(user.resetTokenExpiresAt) < new Date()
    ) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    user.passwordHash = await hash(dto.password, 10);
    user.resetToken = null;
    user.resetTokenExpiresAt = null;
    user.updatedAt = new Date().toISOString();

    await this.usersService.update(user);

    return {
      message: "Password reset successful",
    };
  }

  async verifyAccount(dto: VerifyAccountDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException("Account not found");
    }

    if (user.isVerified) {
      return {
        message: "Account is already verified",
      };
    }

    if (
      !user.verificationCode ||
      !user.verificationCodeExpiresAt ||
      new Date(user.verificationCodeExpiresAt) < new Date() ||
      user.verificationCode !== dto.verificationCode
    ) {
      throw new BadRequestException("Invalid verification code");
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    user.updatedAt = new Date().toISOString();
    await this.usersService.update(user);

    return {
      message: "Account verification successful",
    };
  }

  async googleAuth(dto: GoogleAuthDto) {
    const ticket = await this.verifyGoogleIdToken(dto.idToken);
    if (!ticket) {
      throw new BadRequestException("Invalid Google ID token");
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new BadRequestException("Cannot read email from Google token");
    }

    const email = payload.email.toLowerCase();
    const name = payload.name ?? "Google User";
    const googleId = payload.sub;
    const avatar = payload.picture ?? null;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      existingUser.accountType = "GOOGLE";
      existingUser.googleId = googleId;
      existingUser.avatar = existingUser.avatar ?? avatar;
      existingUser.name = existingUser.name || name;
      existingUser.isVerified = true;
      existingUser.updatedAt = new Date().toISOString();
      await this.usersService.update(existingUser);
      return this.login(existingUser);
    }

    const randomPasswordHash = await hash(randomBytes(32).toString("hex"), 10);
    const user = await this.usersService.create({
      name,
      email,
      passwordHash: randomPasswordHash,
      accountType: "GOOGLE",
      googleId,
      avatar,
      role: "user",
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
    });

    return this.login(user);
  }

  async authenticate2fa(userId: string, dto: Authenticate2faDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException("User does not exist");
    }

    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException("Two-factor authentication is not enabled");
    }

    const isValid = await this.validate2faCode(user, dto.code);
    if (!isValid) {
      throw new BadRequestException("Invalid authentication code");
    }

    return this.login(user, true);
  }

  async setup2fa(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException("User does not exist");
    }

    const appName = process.env.TWO_FACTOR_APP_NAME ?? "PlantWorld";
    const secret = speakeasy.generateSecret({
      name: `${appName}:${user.email}`,
      issuer: appName,
    });

    user.twoFactorSecret = secret.base32;
    user.updatedAt = new Date().toISOString();
    await this.usersService.update(user);

    if (!secret.otpauth_url) {
      throw new BadRequestException("Cannot generate 2FA setup URL");
    }

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    return {
      otpAuthUrl: secret.otpauth_url,
      qrCodeUrl,
    };
  }

  async verify2fa(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException("2FA setup not found");
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException("Invalid authentication code");
    }

    const backupCodes = this.generateBackupCodes();
    user.isTwoFactorEnabled = true;
    user.backupCodes = backupCodes;
    user.updatedAt = new Date().toISOString();
    await this.usersService.update(user);

    return { backupCodes };
  }

  async disable2fa(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException("User does not exist");
    }

    if (!user.isTwoFactorEnabled) {
      return { message: "Two-factor authentication is already disabled" };
    }

    const isValid = await this.validate2faCode(user, code);
    if (!isValid) {
      throw new BadRequestException("Invalid authentication code");
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.backupCodes = [];
    user.updatedAt = new Date().toISOString();
    await this.usersService.update(user);

    return { message: "Two-factor authentication disabled successfully" };
  }

  async check2faStatus(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException("User does not exist");
    }

    return {
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };
  }

  private generateNumericCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private generateBackupCodes(count = 6): string[] {
    return Array.from({ length: count }, () =>
      randomBytes(4).toString("hex").toUpperCase(),
    );
  }

  private async validate2faCode(
    user: StoredUser,
    code: string,
  ): Promise<boolean> {
    if (user.twoFactorSecret) {
      const validOtp = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: code,
        window: 1,
      });

      if (validOtp) {
        return true;
      }
    }

    const backupIndex = user.backupCodes.findIndex(
      (item) => item === code.toUpperCase(),
    );
    if (backupIndex >= 0) {
      user.backupCodes.splice(backupIndex, 1);
      user.updatedAt = new Date().toISOString();
      await this.usersService.update(user);
      return true;
    }

    return false;
  }

  private async verifyGoogleIdToken(idToken: string) {
    const audience = process.env.GOOGLE_CLIENT_ID;
    if (!audience) {
      throw new BadRequestException("GOOGLE_CLIENT_ID is not configured");
    }

    try {
      const client = new OAuth2Client(audience);
      return await client.verifyIdToken({ idToken, audience });
    } catch {
      return null;
    }
  }

  private shouldExposeDebugTokens(): boolean {
    return (
      process.env.NODE_ENV !== "production" ||
      process.env.AUTH_EXPOSE_DEBUG_TOKENS === "true"
    );
  }
}
