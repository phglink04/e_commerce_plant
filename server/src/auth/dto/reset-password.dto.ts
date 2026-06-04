import { IsString, MinLength, Matches } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số",
  })
  password!: string;

  @IsString()
  passwordConfirm!: string;
}
