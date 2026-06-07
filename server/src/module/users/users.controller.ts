import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { UsersService } from "./users.service";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload.type";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AddToCartDto } from "../cart/dto/add-to-cart.dto";
import { UpdateCartDto } from "../cart/dto/update-cart.dto";
import { AddDeliveryPartnerDto } from "./dto/add-delivery-partner.dto";
import { AdminUpdateUserDto } from "./dto/admin-update-user.dto";
import { UploadInterceptor } from "../../helpers/upload.interceptor";
import { SupabaseStorageService } from "../../helpers/supabase-storage.service";
import { PlantsService } from "../plants/plants.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly supabaseStorageService: SupabaseStorageService,
    private readonly plantsService: PlantsService,
  ) {}

  @Patch("updateMyPassword")
  @UseGuards(JwtAuthGuard)
  async updateMyPassword(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      currentPassword: string;
      password: string;
      passwordConfirm: string;
    },
  ) {
    if (body.password !== body.passwordConfirm) {
      throw new BadRequestException("Password confirm does not match");
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(body.password)) {
      throw new BadRequestException(
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số",
      );
    }

    const me = await this.usersService.findById(user.sub);
    if (!me) {
      throw new BadRequestException("User not found");
    }

    const validCurrentPassword = await compare(
      body.currentPassword,
      me.passwordHash,
    );
    if (!validCurrentPassword) {
      throw new BadRequestException("Current password is incorrect");
    }

    me.passwordHash = await hash(body.password, 10);
    me.updatedAt = new Date().toISOString();
    await this.usersService.update(me);

    return { message: "Password updated successfully" };
  }

  @Patch("updateMe")
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    const me = await this.usersService.findById(user.sub);
    if (!me) {
      throw new BadRequestException("User not found");
    }

    if (dto.name) me.name = dto.name;
    if (dto.phone !== undefined) me.phone = dto.phone;
    if (dto.avatar !== undefined) me.avatar = dto.avatar;
    me.updatedAt = new Date().toISOString();

    await this.usersService.update(me);

    return {
      message: "Profile updated successfully",
      data: {
        user: this.usersService.toPublicUser(me),
      },
    };
  }

  @Delete("deleteMe")
  @UseGuards(JwtAuthGuard)
  async deleteMe(@CurrentUser() user: JwtPayload) {
    const users = await this.usersService.getAll();
    const leftUsers = users.filter((item) => item.id !== user.sub);
    await this.usersService.replaceAll(leftUsers);
    return { message: "User deleted successfully" };
  }

  @Post("addtocart")
  @UseGuards(JwtAuthGuard)
  async addToCart(@CurrentUser() user: JwtPayload, @Body() dto: AddToCartDto) {
    const me = await this.usersService.findById(user.sub);
    if (!me) {
      throw new BadRequestException("User not found");
    }

    // Get plant stock information
    const plantData = await this.plantsService.getById(dto.plantId);
    const availableStock = plantData?.data?.plant?.stock ?? 0;
    
    // Validate and adjust quantity if needed
    let requestedQuantity = dto.quantity;
    let quantityAdjusted = false;
    let stockWarning: string | undefined;
    
    if (requestedQuantity > availableStock) {
      requestedQuantity = Math.max(0, availableStock);
      quantityAdjusted = true;
      stockWarning = `Kho hàng chỉ còn ${availableStock} sản phẩm. Số lượng đã được điều chỉnh.`;
    }
    
    if (requestedQuantity <= 0) {
      throw new BadRequestException(
        "Sản phẩm hết hàng"
      );
    }

    const existing = me.cart.find((item) => item.plantId === dto.plantId);
    if (existing) {
      const newQuantity = existing.quantity + requestedQuantity;
      if (newQuantity > availableStock) {
        existing.quantity = Math.max(0, availableStock);
        quantityAdjusted = true;
        stockWarning = `Tổng số lượng vượt quá kho. Đã điều chỉnh thành ${availableStock} sản phẩm.`;
      } else {
        existing.quantity = newQuantity;
      }
      existing.price = dto.price;
    } else {
      me.cart.push({
        plantId: dto.plantId,
        quantity: requestedQuantity,
        price: dto.price,
      });
    }

    me.updatedAt = new Date().toISOString();
    await this.usersService.update(me);

    return {
      message: quantityAdjusted 
        ? "Số lượng được điều chỉnh theo kho hàng" 
        : "Thêm sản phẩm vào giỏ thành công",
      data: {
        cart: me.cart,
        stockWarning,
        quantityAdjusted,
      },
    };
  }

  @Patch("updatecart")
  @UseGuards(JwtAuthGuard)
  async updateCart(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCartDto,
  ) {
    const me = await this.usersService.findById(user.sub);
    if (!me) {
      throw new BadRequestException("User not found");
    }

    const item = me.cart.find((cartItem) => cartItem.plantId === dto.plantId);
    if (!item) {
      throw new BadRequestException("Item not found in cart");
    }

    // Get plant stock information
    const plantData = await this.plantsService.getById(dto.plantId);
    const availableStock = plantData?.data?.plant?.stock ?? 0;
    
    // Validate and adjust quantity if needed
    let newQuantity = Math.max(0, dto.quantity);
    let quantityAdjusted = false;
    let stockWarning: string | undefined;
    
    if (newQuantity > availableStock) {
      newQuantity = Math.max(0, availableStock);
      quantityAdjusted = true;
      stockWarning = `Kho hàng chỉ còn ${availableStock} sản phẩm. Số lượng đã được điều chỉnh.`;
    }
    
    if (newQuantity <= 0) {
      // Remove item from cart if quantity becomes 0
      me.cart = me.cart.filter((cartItem) => cartItem.plantId !== dto.plantId);
    } else {
      item.quantity = newQuantity;
    }
    
    if (dto.price !== undefined) {
      item.price = dto.price;
    }
    
    me.updatedAt = new Date().toISOString();
    await this.usersService.update(me);

    return {
      message: quantityAdjusted 
        ? "Số lượng được điều chỉnh theo kho hàng" 
        : "Cập nhật giỏ hàng thành công",
      data: {
        cart: me.cart,
        stockWarning,
        quantityAdjusted,
        maxQuantity: availableStock,
      },
    };
  }

  @Delete("deleteitem/:plantId")
  @UseGuards(JwtAuthGuard)
  async deleteCartItem(
    @CurrentUser() user: JwtPayload,
    @Param("plantId") plantId: string,
  ) {
    const me = await this.usersService.findById(user.sub);
    if (!me) {
      throw new BadRequestException("User not found");
    }

    me.cart = me.cart.filter((item) => item.plantId !== plantId);
    me.updatedAt = new Date().toISOString();
    await this.usersService.update(me);

    return { message: "Item removed from cart", data: { cart: me.cart } };
  }

  @Get("cart")
  @UseGuards(JwtAuthGuard)
  async getCart(@CurrentUser() user: JwtPayload) {
    const me = await this.usersService.findById(user.sub);
    if (!me) {
      throw new BadRequestException("User not found");
    }

    return { data: { cart: me.cart } };
  }

  @Delete("clear-cart")
  @UseGuards(JwtAuthGuard)
  async clearCart(@CurrentUser() user: JwtPayload) {
    const me = await this.usersService.findById(user.sub);
    if (!me) {
      throw new BadRequestException("User not found");
    }

    me.cart = [];
    me.updatedAt = new Date().toISOString();
    await this.usersService.update(me);

    return { message: "Cart cleared" };
  }

  @Get("check-availability")
  @UseGuards(JwtAuthGuard)
  async checkCartAvailability(@CurrentUser() user: JwtPayload) {
    const me = await this.usersService.findById(user.sub);
    if (!me) {
      throw new BadRequestException("User not found");
    }

    return {
      data: {
        available: true,
        unavailableItems: [],
        cart: me.cart,
      },
    };
  }

  @Get("cart/total")
  @UseGuards(JwtAuthGuard)
  async getCartTotal(@CurrentUser() user: JwtPayload) {
    const me = await this.usersService.findById(user.sub);
    if (!me) {
      throw new BadRequestException("User not found");
    }

    const total = me.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    return {
      data: {
        total,
      },
    };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: JwtPayload) {
    const me = await this.usersService.findById(user.sub);
    if (!me) {
      throw new BadRequestException("User not found");
    }

    return {
      data: {
        user: {
          ...this.usersService.toPublicUser(me),
          createdAt: me.createdAt,
        },
      },
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  async getAllUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("role") role?: string,
    @Query("search") search?: string,
  ) {
    const result = await this.usersService.searchForAdmin({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      role,
      search,
    });

    return {
      totalResults: result.totalResults,
      page: result.page,
      totalPages: result.totalPages,
      limit: result.limit,
      data: {
        users: result.users.map((item) => ({
          ...this.usersService.toPublicUser(item),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      },
    };
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  async getUserById(@Param("id") id: string) {
    const target = await this.usersService.findById(id);
    if (!target) {
      throw new BadRequestException("User not found");
    }

    return {
      data: {
        user: {
          ...this.usersService.toPublicUser(target),
          createdAt: target.createdAt,
          updatedAt: target.updatedAt,
        },
      },
    };
  }

  @Patch("update-avatar")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UploadInterceptor("avatar"))
  async updateAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("Avatar file is required");
    }

    const me = await this.usersService.findById(user.sub);
    if (!me) {
      throw new BadRequestException("User not found");
    }

    me.avatar = await this.supabaseStorageService.uploadFile(file, "avatars");
    me.updatedAt = new Date().toISOString();
    await this.usersService.update(me);

    return {
      message: "Avatar updated successfully",
      data: {
        user: this.usersService.toPublicUser(me),
      },
    };
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  async adminUpdateUser(
    @Param("id") id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    const target = await this.usersService.findById(id);
    if (!target) {
      throw new BadRequestException("User not found");
    }

    if (dto.name !== undefined) {
      target.name = dto.name;
    }
    if (dto.phone !== undefined) {
      target.phone = dto.phone;
    }
    if (dto.role !== undefined) {
      target.role = dto.role;
    }
    if (dto.isActive !== undefined) {
      target.isActive = dto.isActive;
    }

    target.updatedAt = new Date().toISOString();
    await this.usersService.update(target);

    return {
      message: "User updated",
      data: {
        user: this.usersService.toPublicUser(target),
      },
    };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  async adminDeleteUser(@Param("id") id: string) {
    const users = await this.usersService.getAll();
    const target = users.find((item) => item.id === id);
    if (!target) {
      throw new BadRequestException("User not found");
    }

    const leftUsers = users.filter((item) => item.id !== id);
    await this.usersService.replaceAll(leftUsers);

    return { message: "User deleted" };
  }

  @Post("add-delivery-partner")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  async addDeliveryPartner(@Body() dto: AddDeliveryPartnerDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException("Email already exists");
    }

    const passwordHash = await hash(dto.password, 10);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      verificationCode: "000000",
      role: "deliverypartner",
      phone: dto.phone ?? null,
    });

    user.isVerified = true;
    user.verificationCode = null;
    user.updatedAt = new Date().toISOString();
    await this.usersService.update(user);

    return {
      message: "Delivery partner created",
      data: {
        user: this.usersService.toPublicUser(user),
      },
    };
  }
}
