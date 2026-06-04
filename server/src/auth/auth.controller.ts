import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyAccountDto } from "./dto/verify-account.dto";
import { SendActivationDto } from "./dto/send-activation.dto";
import { AuthResetPasswordDto } from "./dto/auth-reset-password.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtPayload } from "./types/jwt-payload.type";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { Authenticate2faDto } from "./dto/2fa/authenticate-2fa.dto";
import { Verify2faDto } from "./dto/2fa/verify-2fa.dto";
import { Disable2faDto } from "./dto/2fa/disable-2fa.dto";
import { TurnstileService } from "../helpers/turnstile.service";
import { LoginDto } from "./dto/login.dto";
import { StoredUser } from "../module/users/types/user.type";

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly turnstileService: TurnstileService,
  ) {}

  @Post("auth/register")
  register(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post("users/signup")
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post("auth/login")
  @UseGuards(LocalAuthGuard)
  async authLogin(@Req() req: Request, @Body() dto: LoginDto) {
    const isProduction = process.env.NODE_ENV === "production";
    await this.turnstileService.verifyTokenIfRequired(
      dto.captchaToken,
      isProduction,
    );

    const user = req.user as StoredUser;
    if (dto.targetRole) {
      if (dto.targetRole === "admin") {
        if (user.role !== "admin" && user.role !== "owner") {
          throw new UnauthorizedException("Tài khoản không hợp lệ");
        }
      } else if (user.role !== dto.targetRole) {
        throw new UnauthorizedException("Tài khoản không hợp lệ");
      }
    }

    return this.authService.login(user);
  }

  @Post("users/login")
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: Request, @Body() dto: LoginDto) {
    const isProduction = process.env.NODE_ENV === "production";
    await this.turnstileService.verifyTokenIfRequired(
      dto.captchaToken,
      isProduction,
    );

    const user = req.user as StoredUser;
    if (dto.targetRole) {
      if (dto.targetRole === "admin") {
        if (user.role !== "admin" && user.role !== "owner") {
          throw new UnauthorizedException("Tài khoản không hợp lệ");
        }
      } else if (user.role !== dto.targetRole) {
        throw new UnauthorizedException("Tài khoản không hợp lệ");
      }
    }

    return this.authService.login(user);
  }

  @Post("auth/send-activation")
  sendActivation(@Body() dto: SendActivationDto) {
    return this.authService.sendActivation(dto);
  }

  @Post("auth/activate")
  activate(@Body() dto: VerifyAccountDto) {
    return this.authService.verifyAccount(dto);
  }

  @Post("auth/forgot-password")
  authForgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post("users/forgetPassword")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post("auth/reset-password")
  authResetPassword(@Body() dto: AuthResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto);
  }

  @Patch("users/resetPassword/:token")
  resetPassword(@Param("token") token: string, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(token, dto);
  }

  @Post("auth/verify-account")
  verifyAccount(@Body() dto: VerifyAccountDto) {
    return this.authService.verifyAccount(dto);
  }

  @Post("auth/google-auth")
  googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto);
  }

  @Post("auth/2fa/authenticate")
  authenticate2fa(@Body() body: { userId: string } & Authenticate2faDto) {
    return this.authService.authenticate2fa(body.userId, { code: body.code });
  }

  @Post("auth/2fa/setup")
  @UseGuards(JwtAuthGuard)
  setup2fa(@CurrentUser() user: JwtPayload) {
    return this.authService.setup2fa(user.sub);
  }

  @Post("auth/2fa/verify")
  @UseGuards(JwtAuthGuard)
  verify2fa(@CurrentUser() user: JwtPayload, @Body() dto: Verify2faDto) {
    return this.authService.verify2fa(user.sub, dto.code);
  }

  @Post("auth/2fa/disable")
  @UseGuards(JwtAuthGuard)
  disable2fa(@CurrentUser() user: JwtPayload, @Body() dto: Disable2faDto) {
    return this.authService.disable2fa(user.sub, dto.code);
  }

  @Get("auth/2fa/status")
  @UseGuards(JwtAuthGuard)
  check2faStatus(@CurrentUser() user: JwtPayload) {
    return this.authService.check2faStatus(user.sub);
  }
}
