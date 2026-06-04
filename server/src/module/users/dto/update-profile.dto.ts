import { IsOptional, IsString, MinLength, Matches } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @Matches(/^[^\d]/, {
    message: "Họ tên không được phép bắt đầu bằng chữ số",
  })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, {
    message: "Số điện thoại không hợp lệ (định dạng Việt Nam, ví dụ: 0912345678)",
  })
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
