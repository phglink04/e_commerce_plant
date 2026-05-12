import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  chatId?: string;
}
