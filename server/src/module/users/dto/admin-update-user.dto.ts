import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsIn(["user", "admin", "owner", "deliverypartner"])
  role?: "user" | "admin" | "owner" | "deliverypartner";

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
