import { IsEmail } from "class-validator";

export class SendActivationDto {
  @IsEmail()
  email!: string;
}
