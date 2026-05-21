import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cart } from "./Schemas/cart.schema";
import { PlantsService } from "../plants/plants.service";

type CartItemInput = {
  plantId: string;
  quantity: number;
  price: number;
};

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    private readonly plantsService: PlantsService,
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
    
    // Get plant stock information
    const plantData = await this.plantsService.getById(item.plantId);
    const availableStock = plantData?.data?.plant?.stock ?? 0;
    
    // Validate and adjust quantity if needed
    const maxAllowedQuantity = availableStock;
    let requestedQuantity = item.quantity;
    let quantityAdjusted = false;
    let stockWarning: string | undefined;
    
    if (requestedQuantity > maxAllowedQuantity) {
      requestedQuantity = Math.max(0, maxAllowedQuantity);
      quantityAdjusted = true;
      stockWarning = `Kho hàng chỉ còn ${maxAllowedQuantity} sản phẩm. Số lượng đã được điều chỉnh.`;
    }
    
    if (requestedQuantity <= 0) {
      return {
        message: "Sản phẩm hết hàng",
        data: {
          cart: this.toResponse(cart),
          stockWarning: "Sản phẩm này hiện đã hết hàng",
        },
      };
    }
    
    const existing = cart.items.find(
      (cartItem) => String(cartItem.plantId) === item.plantId,
    );

    if (existing) {
      const newQuantity = existing.quantity + requestedQuantity;
      if (newQuantity > maxAllowedQuantity) {
        existing.quantity = Math.max(0, maxAllowedQuantity);
        quantityAdjusted = true;
        stockWarning = `Tổng số lượng vượt quá kho. Đã điều chỉnh thành ${maxAllowedQuantity} sản phẩm.`;
      } else {
        existing.quantity = newQuantity;
      }
      existing.price = item.price;
    } else {
      cart.items.push({
        plantId: item.plantId as never,
        quantity: requestedQuantity,
        price: item.price,
      });
    }

    const saved = await cart.save();
    return {
      message: quantityAdjusted 
        ? "Số lượng được điều chỉnh theo kho hàng" 
        : "Thêm sản phẩm vào giỏ thành công",
      data: {
        cart: this.toResponse(saved.toObject()),
        stockWarning,
        quantityAdjusted,
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
        message: "Sản phẩm không tìm thấy trong giỏ",
        data: {
          cart: this.toResponse(cart),
        },
      };
    }

    // Get plant stock information
    const plantData = await this.plantsService.getById(plantId);
    const availableStock = plantData?.data?.plant?.stock ?? 0;
    
    // Validate and adjust quantity if needed
    let newQuantity = Math.max(0, payload.quantity);
    let quantityAdjusted = false;
    let stockWarning: string | undefined;
    
    if (newQuantity > availableStock) {
      newQuantity = Math.max(0, availableStock);
      quantityAdjusted = true;
      stockWarning = `Kho hàng chỉ còn ${availableStock} sản phẩm. Số lượng đã được điều chỉnh.`;
    }
    
    if (newQuantity <= 0) {
      // Remove item from cart if quantity becomes 0
      cart.items = cart.items.filter(
        (cartItem) => String(cartItem.plantId) !== plantId,
      ) as never;
    } else {
      item.quantity = newQuantity;
    }
    
    const saved = await cart.save();

    return {
      message: quantityAdjusted 
        ? "Số lượng được điều chỉnh theo kho hàng" 
        : "Cập nhật giỏ hàng thành công",
      data: {
        cart: this.toResponse(saved.toObject()),
        stockWarning,
        quantityAdjusted,
        maxQuantity: availableStock,
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
