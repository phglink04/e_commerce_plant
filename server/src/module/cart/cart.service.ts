import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cart } from "./Schemas/cart.schema";

type CartItemInput = {
  plantId: string;
  quantity: number;
  price: number;
};

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
  ) {}

  async getMyCart(userId: string) {
    const cart = await this.ensureCart(userId);
    return {
      data: {
        cart: this.toResponse(cart),
      },
    };
  }

  async addItem(userId: string, item: CartItemInput) {
    const cart = await this.ensureCart(userId);
    const existing = cart.items.find(
      (cartItem) => String(cartItem.plantId) === item.plantId,
    );

    if (existing) {
      existing.quantity += item.quantity;
      existing.price = item.price;
    } else {
      cart.items.push({
        plantId: item.plantId as never,
        quantity: item.quantity,
        price: item.price,
      });
    }

    const saved = await cart.save();
    return {
      message: "Item added to cart",
      data: {
        cart: this.toResponse(saved.toObject()),
      },
    };
  }

  async updateItem(
    userId: string,
    plantId: string,
    payload: { quantity: number },
  ) {
    const cart = await this.ensureCart(userId);
    const item = cart.items.find(
      (cartItem) => String(cartItem.plantId) === plantId,
    );

    if (!item) {
      return {
        message: "Item not found in cart",
        data: {
          cart: this.toResponse(cart),
        },
      };
    }

    item.quantity = payload.quantity;
    const saved = await cart.save();

    return {
      message: "Cart item updated",
      data: {
        cart: this.toResponse(saved.toObject()),
      },
    };
  }

  async removeItem(userId: string, plantId: string) {
    const cart = await this.ensureCart(userId);
    cart.items = cart.items.filter(
      (cartItem) => String(cartItem.plantId) !== plantId,
    ) as never;

    const saved = await cart.save();
    return {
      message: "Item removed from cart",
      data: {
        cart: this.toResponse(saved.toObject()),
      },
    };
  }

  async clear(userId: string) {
    const cart = await this.ensureCart(userId);
    cart.items = [] as never;
    const saved = await cart.save();

    return {
      message: "Cart cleared",
      data: {
        cart: this.toResponse(saved.toObject()),
      },
    };
  }

  private async ensureCart(userId: string) {
    const existing = await this.cartModel.findOne({ userId });
    if (existing) {
      return existing;
    }

    return this.cartModel.create({
      userId,
      items: [],
    });
  }

  private toResponse(cart: {
    _id: unknown;
    userId: unknown;
    items: Array<{
      plantId: unknown;
      quantity: number;
      price: number;
    }>;
  }) {
    const total = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    return {
      id: String(cart._id),
      userId: String(cart.userId),
      items: cart.items.map((item) => ({
        plantId: String(item.plantId),
        quantity: item.quantity,
        price: item.price,
      })),
      total,
    };
  }
}
