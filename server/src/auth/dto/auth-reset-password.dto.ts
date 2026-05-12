import { IsString } from "class-validator";
import { ResetPasswordDto } from "./reset-password.dto";

export class AuthResetPasswordDto extends ResetPasswordDto {
  @IsString()
  token!: string;
}
