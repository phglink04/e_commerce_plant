import { IsString, Length } from "class-validator";

export class Disable2faDto {
  @IsString()
  @Length(6, 12)
  code!: string;
}
