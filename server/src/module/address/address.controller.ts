import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AddressService } from "./address.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload.type";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@Controller("addresses")
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get("my")
  getMyAddresses(@CurrentUser() user: JwtPayload) {
    return this.addressService.getMyAddresses(user.sub);
  }

  @Post()
  createAddress(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      fullName: string;
      phone: string;
      city: string;
      district: string;
      ward: string;
      addressLine: string;
      isDefault?: boolean;
    },
  ) {
    return this.addressService.createAddress(user.sub, body);
  }

  @Patch(":addressId")
  updateAddress(
    @CurrentUser() user: JwtPayload,
    @Param("addressId") addressId: string,
    @Body()
    body: {
      fullName?: string;
      phone?: string;
      city?: string;
      district?: string;
      ward?: string;
      addressLine?: string;
      isDefault?: boolean;
    },
  ) {
    return this.addressService.updateAddress(user.sub, addressId, body);
  }

  @Delete(":addressId")
  deleteAddress(
    @CurrentUser() user: JwtPayload,
    @Param("addressId") addressId: string,
  ) {
    return this.addressService.deleteAddress(user.sub, addressId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles("admin", "owner")
  getMyAddressesAdminView(
    @CurrentUser() user: JwtPayload,
    @Query("userId") userId?: string,
  ) {
    return this.addressService.getMyAddresses(userId ?? user.sub);
  }
}
