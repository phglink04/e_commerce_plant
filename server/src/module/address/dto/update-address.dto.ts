import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import { CreateAddressDto } from "./create-address.dto";
export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
