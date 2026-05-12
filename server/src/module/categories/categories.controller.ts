import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getAll(@Query() query: Record<string, string | undefined>) {
    return this.categoriesService.getAll(query);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const category = await this.categoriesService.getById(id);
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  async update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    const category = await this.categoriesService.update(id, dto);
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "owner")
  async remove(@Param("id") id: string) {
    const removed = await this.categoriesService.remove(id);
    if (!removed) {
      throw new BadRequestException("Category not found");
    }
    return { message: "Category deleted" };
  }
}
