import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload.type";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.sub, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner", "deliverypartner")
  getAllOrders(
    @CurrentUser() user: JwtPayload,
    @Query() query: Record<string, string | undefined>,
  ) {
    const deliveryPartnerId =
      user.role === "deliverypartner" ? user.sub : query.deliveryPartnerId;

    return this.ordersService.getAll({
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      search: query.search,
      orderStatus: query.orderStatus ?? query.status,
      paymentStatus: query.paymentStatus,
      deliveryPartnerId,
      userId: query.userId,
    });
  }

  @Get("myorders")
  @UseGuards(JwtAuthGuard)
  getMyOrders(@CurrentUser() user: JwtPayload) {
    return this.ordersService.getMyOrders(user.sub);
  }

  @Get("myorders/:orderId")
  @UseGuards(JwtAuthGuard)
  async getMyOrderById(
    @CurrentUser() user: JwtPayload,
    @Param("orderId") orderId: string,
  ) {
    const order = await this.ordersService.getMyOrderById(user.sub, orderId);
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return { data: { order } };
  }

  @Patch(":orderId/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner", "deliverypartner")
  async updateOrderStatus(
    @Param("orderId") orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateOrderStatus(orderId, {
      orderStatus: dto.orderStatus,
      paymentStatus: dto.paymentStatus,
      deliveryPartnerId: dto.deliveryPartnerId,
      deliveryPartnerName: dto.deliveryPartnerName,
      returnReason: dto.returnReason,
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return { message: "Order status updated", data: { order } };
  }

  @Patch(":orderId/cancel")
  @UseGuards(JwtAuthGuard)
  async cancelOrder(
    @CurrentUser() user: JwtPayload,
    @Param("orderId") orderId: string,
  ) {
    const order = await this.ordersService.cancelOrder(orderId, user.sub);
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (order === "DELIVERED") {
      throw new BadRequestException("Delivered order cannot be cancelled");
    }
    return { message: "Order cancelled", data: { order } };
  }

  @Get(":orderId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner", "deliverypartner")
  async getOrderById(@Param("orderId") orderId: string) {
    const order = await this.ordersService.getOrderById(orderId);
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return { data: { order } };
  }
}
