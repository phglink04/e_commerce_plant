import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Address } from "./Schemas/address.schema";

type AddressInput = {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  addressLine: string;
  isDefault?: boolean;
};

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name) private readonly addressModel: Model<Address>,
  ) {}

  async getMyAddresses(userId: string) {
    const addresses = await this.addressModel
      .find({ userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return {
      data: {
        addresses: addresses.map((item) => this.toResponse(item)),
      },
    };
  }

  async createAddress(userId: string, payload: AddressInput) {
    const shouldSetDefault = payload.isDefault ?? false;

    if (shouldSetDefault) {
      await this.addressModel.updateMany(
        { userId, isDefault: true },
        { $set: { isDefault: false } },
      );
    }

    const created = await this.addressModel.create({
      userId,
      fullName: payload.fullName,
      phone: payload.phone,
      city: payload.city,
      district: payload.district,
      ward: payload.ward,
      addressLine: payload.addressLine,
      isDefault: shouldSetDefault,
    });

    return {
      message: "Address created",
      data: {
        address: this.toResponse(created.toObject()),
      },
    };
  }

  async updateAddress(
    userId: string,
    addressId: string,
    payload: Partial<AddressInput>,
  ) {
    const existing = await this.addressModel
      .findOne({ _id: addressId, userId })
      .lean();

    if (!existing) {
      throw new NotFoundException("Address not found");
    }

    if (payload.isDefault === true) {
      await this.addressModel.updateMany(
        { userId, isDefault: true },
        { $set: { isDefault: false } },
      );
    }

    const updated = await this.addressModel
      .findByIdAndUpdate(addressId, payload, { new: true })
      .lean();

    if (!updated) {
      throw new NotFoundException("Address not found");
    }

    return {
      message: "Address updated",
      data: {
        address: this.toResponse(updated),
      },
    };
  }

  async deleteAddress(userId: string, addressId: string) {
    const deleted = await this.addressModel
      .findOneAndDelete({ _id: addressId, userId })
      .lean();

    if (!deleted) {
      throw new NotFoundException("Address not found");
    }

    return {
      message: "Address deleted",
    };
  }

  private toResponse(address: {
    _id: unknown;
    userId: unknown;
    fullName: string;
    phone: string;
    city: string;
    district: string;
    ward: string;
    addressLine: string;
    isDefault: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }) {
    return {
      id: String(address._id),
      userId: String(address.userId),
      fullName: address.fullName,
      phone: address.phone,
      city: address.city,
      district: address.district,
      ward: address.ward,
      addressLine: address.addressLine,
      isDefault: address.isDefault,
      createdAt:
        address.createdAt instanceof Date
          ? address.createdAt.toISOString()
          : (address.createdAt ?? new Date().toISOString()),
      updatedAt:
        address.updatedAt instanceof Date
          ? address.updatedAt.toISOString()
          : (address.updatedAt ?? new Date().toISOString()),
    };
  }
}
