import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Delivery } from "./Schemas/delivery.schema";

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(Delivery.name)
    private readonly deliveryModel: Model<Delivery>,
  ) {}

  async assign(orderId: string, deliveryPartnerId: string) {
    const existing = await this.deliveryModel.findOne({ orderId }).lean();

    if (existing) {
      const updated = await this.deliveryModel
        .findByIdAndUpdate(
          existing._id,
          {
            deliveryPartnerId,
            status: "assigned",
          },
          { new: true },
        )
        .lean();

      if (!updated) {
        throw new NotFoundException("Delivery assignment not found");
      }

      return {
        message: "Delivery reassigned",
        data: { delivery: this.toResponse(updated) },
      };
    }

    const created = await this.deliveryModel.create({
      orderId,
      deliveryPartnerId,
      status: "assigned",
    });

    return {
      message: "Delivery assigned",
      data: { delivery: this.toResponse(created.toObject()) },
    };
  }

  async getMyAssignments(deliveryPartnerId: string) {
    const deliveries = await this.deliveryModel
      .find({ deliveryPartnerId })
      .sort({ createdAt: -1 })
      .lean();

    return {
      data: {
        deliveries: deliveries.map((item) => this.toResponse(item)),
      },
    };
  }

  async getAll() {
    const deliveries = await this.deliveryModel
      .find()
      .sort({ createdAt: -1 })
      .lean();

    return {
      data: {
        deliveries: deliveries.map((item) => this.toResponse(item)),
      },
    };
  }

  async updateStatus(deliveryId: string, status: string) {
    const updated = await this.deliveryModel
      .findByIdAndUpdate(deliveryId, { status }, { new: true })
      .lean();

    if (!updated) {
      throw new NotFoundException("Delivery not found");
    }

    return {
      message: "Delivery status updated",
      data: { delivery: this.toResponse(updated) },
    };
  }

  private toResponse(delivery: {
    _id: unknown;
    orderId: unknown;
    deliveryPartnerId: unknown;
    status: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }) {
    return {
      id: String(delivery._id),
      orderId: String(delivery.orderId),
      deliveryPartnerId: String(delivery.deliveryPartnerId),
      status: delivery.status,
      createdAt:
        delivery.createdAt instanceof Date
          ? delivery.createdAt.toISOString()
          : (delivery.createdAt ?? new Date().toISOString()),
      updatedAt:
        delivery.updatedAt instanceof Date
          ? delivery.updatedAt.toISOString()
          : (delivery.updatedAt ?? new Date().toISOString()),
    };
  }
}
