import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from "class-validator";

export class SignupDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @ValidateIf((dto: SignupDto) => dto.passwordConfirm !== undefined)
  @IsString()
  passwordConfirm?: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}
