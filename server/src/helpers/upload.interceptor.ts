import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import * as multer from "multer";
import { Observable } from "rxjs";

export function UploadInterceptor(fieldName: string = "file") {
  @Injectable()
  class MulterInterceptor implements NestInterceptor {
    async intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Promise<Observable<unknown>> {
      const interceptor = new (FileInterceptor(fieldName, {
        storage: multer.memoryStorage(),
        limits: {
          fileSize: 10 * 1024 * 1024,
        },
        fileFilter: (_, file, callback) => {
          if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/i)) {
            callback(
              new BadRequestException(
                "Only image files are allowed (jpg, jpeg, png, gif, webp)",
              ),
              false,
            );
            return;
          }

          callback(null, true);
        },
      }))();

      return interceptor.intercept(context, next);
    }
  }

  return MulterInterceptor;
}
