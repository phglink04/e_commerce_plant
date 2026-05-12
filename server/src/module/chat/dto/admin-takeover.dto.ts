import { IsNotEmpty, IsString } from "class-validator";

export class AdminTakeoverDto {
  @IsString()
  @IsNotEmpty()
  chatId!: string;
}
