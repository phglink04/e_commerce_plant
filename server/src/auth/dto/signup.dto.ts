import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  Matches,
} from "class-validator";

export class SignupDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[^\d]/, {
    message: "Họ tên không được phép bắt đầu bằng chữ số",
  })
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số",
  })
  password!: string;

  @IsOptional()
  @ValidateIf((dto: SignupDto) => dto.passwordConfirm !== undefined)
  @IsString()
  passwordConfirm?: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}
