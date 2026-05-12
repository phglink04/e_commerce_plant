import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(/\S/, { message: "fullName must not be blank" })
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+\-\s()]{8,20}$/, {
    message: "phone format is invalid",
  })
  phone!: string;

  @IsString()
  city?: string;

  @IsString()
  district?: string;

  @IsString()
  ward?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/\S/, { message: "addressLine must not be blank" })
  addressLine!: string;
}
