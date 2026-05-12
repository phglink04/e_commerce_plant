import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload.type";
import { OrdersService } from "../orders/orders.service";
import { PaymentService } from "./payment.service";
import { CreatePaymentQrDto } from "./dto/create-payment-qr.dto";
import { CheckPaymentDto } from "./dto/check-payment.dto";

@Controller("payment")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post("generate-qr")
  @Roles("user", "admin", "owner", "deliverypartner")
  async generatePaymentQR(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePaymentQrDto,
  ) {
    try {
      const order = await this.ordersService.getOrderById(dto.orderId);
      if (!order) {
        throw new NotFoundException("Order not found");
      }

      if (user.role === "user" && order.userId !== user.sub) {
        throw new BadRequestException("You can only pay your own order");
      }

      const terminalStatuses = [
        "delivered",
        "cancelled",
        "shipped",
      ];
      const paidPaymentStatuses = ["paid"];
      if (
        terminalStatuses.includes(order.orderStatus) ||
        paidPaymentStatuses.includes(order.paymentStatus)
      ) {
        throw new BadRequestException(
          "Order is already completed, paid, or cancelled",
        );
      }

      // Reuse existing transactionCode if order already has one (page refresh scenario)
      let transactionCode = order.transactionCode;
      if (!transactionCode) {
        transactionCode = this.paymentService.generateTransactionCode();
        // Persist transactionCode on the order so it survives page refreshes
        await this.ordersService.savePaymentInfo(dto.orderId, {
          transactionCode,
          paymentMethod: "qr",
        });
      }

      const qrData = await this.paymentService.createPaymentQR(
        order.total,
        transactionCode,
      );

      return {
        qrDataURL: qrData.data.qrDataURL,
        transactionCode,
        amount: order.total,
        orderId: order.id,
        bankInfo: qrData.bankInfo,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : "Unable to generate VietQR";
      throw new InternalServerErrorException(message);
    }
  }

  @Post("check-payment")
  @Roles("user", "admin", "owner", "deliverypartner")
  async checkPayment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckPaymentDto,
  ) {
    try {
      const order = await this.ordersService.getOrderById(dto.orderId);
      if (!order) {
        throw new NotFoundException("Order not found");
      }

      if (user.role === "user" && order.userId !== user.sub) {
        throw new BadRequestException(
          "You can only check your own order payment",
        );
      }

      // Already paid — return immediately
      if (order.paymentStatus === "paid") {
        return { paid: true, order };
      }

      if (
        order.orderStatus === "cancelled" ||
        order.paymentStatus === "failed"
      ) {
        throw new BadRequestException(
          "Order is already cancelled or failed",
        );
      }

      const paymentStatus = await this.paymentService.checkPaymentStatus(
        dto.transactionCode,
        dto.amount,
      );

      if (!paymentStatus.paid) {
        return { paid: false };
      }

      // Only update if the order is still unpaid (avoid duplicate updates from polling)
      let updatedOrder = order;
      if (order.paymentStatus === "unpaid") {
        const result = await this.ordersService.updateOrderStatus(
          dto.orderId,
          { orderStatus: "confirmed", paymentStatus: "paid" },
        );
        if (result) {
          updatedOrder = result;
        }
      }

      return {
        paid: true,
        transaction: paymentStatus.transaction,
        order: updatedOrder,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to verify transfer status";
      throw new InternalServerErrorException(message);
    }
  }

  /**
   * GET /payment/check/:orderId
   * Check payment status for an order using the saved transactionCode.
   * Does not require the client to remember the transactionCode.
   */
  @Get("check/:orderId")
  @Roles("user", "admin", "owner", "deliverypartner")
  async checkPaymentByOrder(
    @CurrentUser() user: JwtPayload,
    @Param("orderId") orderId: string,
  ) {
    try {
      const order = await this.ordersService.getOrderById(orderId);
      if (!order) {
        throw new NotFoundException("Order not found");
      }

      if (user.role === "user" && order.userId !== user.sub) {
        throw new BadRequestException("You can only check your own order");
      }

      // Already paid or beyond
      if (order.paymentStatus === "paid") {
        return { paid: true, order };
      }

      // No transactionCode saved — cannot verify
      if (!order.transactionCode) {
        return { paid: false, order };
      }

      // Already cancelled/failed
      if (
        order.orderStatus === "cancelled" ||
        order.paymentStatus === "failed"
      ) {
        return { paid: false, order };
      }

      const result = await this.paymentService.checkPaymentStatus(
        order.transactionCode,
        order.total,
      );

      if (result.paid) {
        const updated = await this.ordersService.updateOrderStatus(
          orderId,
          { orderStatus: "confirmed", paymentStatus: "paid" },
        );
        return {
          paid: true,
          order: updated ?? order,
          transaction: result.transaction,
        };
      }

      return { paid: false, order };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to verify transfer status";
      throw new InternalServerErrorException(message);
    }
  }

  @Post("checkout")
  @Roles("user", "admin", "owner", "deliverypartner")
  checkout(@Body() body: { amount?: number; currency?: string }) {
    return {
      message:
        "Use /payment/generate-qr and /payment/check-payment for real payment flow",
      data: {
        amount: body.amount ?? 0,
        currency: body.currency ?? "VND",
      },
    };
  }
}
