import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import * as multer from "multer";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";

@Controller("debug")
export class DebugUploadController {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multer.memoryStorage(),
    }),
  )
  async debugUpload(
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      console.log("========== DEBUG START ==========");

      // ENV
      const url = this.configService.get<string>(
        "SUPABASE_URL",
      );

      const key = this.configService.get<string>(
        "SUPABASE_SERVICE_ROLE_KEY",
      );

      const bucket =
        this.configService.get<string>(
          "SUPABASE_BUCKET",
        ) || "products";

      console.log("URL:", url);
      console.log("KEY EXISTS:", !!key);
      console.log("BUCKET:", bucket);

      // FILE
      console.log("FILE EXISTS:", !!file);

      if (file) {
        console.log("FILE NAME:", file.originalname);
        console.log("FILE SIZE:", file.size);
        console.log("FILE MIME:", file.mimetype);
        console.log("BUFFER EXISTS:", !!file.buffer);
      }

      // CREATE CLIENT
      const client = createClient(url!, key!, {
        auth: {
          persistSession: false,
        },
      });

      console.log("CLIENT CREATED");

      // TEST SIMPLE UPLOAD
      const fileName = `debug-${Date.now()}.txt`;

      console.log("STARTING UPLOAD...");

      const { data, error } = await client.storage
        .from(bucket)
        .upload(
          fileName,
          Buffer.from("hello world"),
          {
            contentType: "text/plain",
            upsert: true,
          },
        );

      console.log("UPLOAD FINISHED");

      console.log("UPLOAD DATA:", data);

      console.log("UPLOAD ERROR:", error);

      // TEST IMAGE UPLOAD
      if (file?.buffer) {
        const imageName = `image-${Date.now()}-${file.originalname}`;

        console.log("START IMAGE UPLOAD...");

        const {
          data: imageData,
          error: imageError,
        } = await client.storage
          .from(bucket)
          .upload(
            imageName,
            Buffer.from(file.buffer),
            {
              contentType: file.mimetype,
              upsert: true,
            },
          );

        console.log("IMAGE DATA:", imageData);

        console.log("IMAGE ERROR:", imageError);

        if (!imageError) {
          const { data: publicUrlData } =
            client.storage
              .from(bucket)
              .getPublicUrl(imageName);

          console.log(
            "PUBLIC URL:",
            publicUrlData.publicUrl,
          );

          return {
            success: true,
            publicUrl: publicUrlData.publicUrl,
          };
        }
      }

      return {
        success: !error,
        data,
        error,
      };
    } catch (err) {
      console.log("========== CATCH ERROR ==========");
      console.log(err);

      return {
        success: false,
        error: err,
      };
    }
  }
}