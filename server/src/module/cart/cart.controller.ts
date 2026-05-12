import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload.type";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getMyCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.getMyCart(user.sub);
  }

  @Post("items")
  addItem(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      plantId: string;
      quantity: number;
      price: number;
    },
  ) {
    return this.cartService.addItem(user.sub, body);
  }

  @Patch("items/:plantId")
  updateItem(
    @CurrentUser() user: JwtPayload,
    @Param("plantId") plantId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateItem(user.sub, plantId, body);
  }

  @Delete("items/:plantId")
  removeItem(
    @CurrentUser() user: JwtPayload,
    @Param("plantId") plantId: string,
  ) {
    return this.cartService.removeItem(user.sub, plantId);
  }

  @Delete()
  clear(@CurrentUser() user: JwtPayload) {
    return this.cartService.clear(user.sub);
  }
}
