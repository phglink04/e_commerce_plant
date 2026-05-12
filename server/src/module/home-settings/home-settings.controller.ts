import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../../auth/guards/admin.guard";
import { UpdateHomeSettingsDto } from "./dto/update-home-settings.dto";
import { HomeSettingsService } from "./home-settings.service";
import { SupabaseStorageService } from "../../helpers/supabase-storage.service";
import { UploadInterceptor } from "../../helpers/upload.interceptor";

@Controller("home-settings")
export class HomeSettingsController {
  constructor(
    private readonly homeSettingsService: HomeSettingsService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  @Get()
  getSettings() {
    return this.homeSettingsService.getSettings();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateSettings(@Body() dto: UpdateHomeSettingsDto) {
    return this.homeSettingsService.updateSettings(dto);
  }

  @Post("upload-banner")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(UploadInterceptor("file"))
  async uploadBanner(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Vui lòng chọn file ảnh");
    }

    const folder = "home-settings";
    const imageUrl = await this.storageService.uploadFile(file, folder);

    return {
      message: "Upload ảnh thành công",
      url: imageUrl,
    };
  }
}
