import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { DeliveryService } from "./delivery.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload.type";

@Controller("delivery")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get("my-assignments")
  @Roles("deliverypartner")
  getMyAssignments(@CurrentUser() user: JwtPayload) {
    return this.deliveryService.getMyAssignments(user.sub);
  }

  @Get()
  @Roles("admin", "owner")
  getAll() {
    return this.deliveryService.getAll();
  }

  @Post("assign")
  @Roles("admin", "owner")
  assign(
    @Body()
    body: {
      orderId: string;
      deliveryPartnerId: string;
    },
  ) {
    return this.deliveryService.assign(body.orderId, body.deliveryPartnerId);
  }

  @Patch(":deliveryId/status")
  @Roles("admin", "owner", "deliverypartner")
  updateStatus(
    @Param("deliveryId") deliveryId: string,
    @Body() body: { status: string },
  ) {
    return this.deliveryService.updateStatus(deliveryId, body.status);
  }
}
