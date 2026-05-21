import { Module } from "@nestjs/common";
import { DebugUploadController } from "./debug-upload.controller";

@Module({
  controllers: [DebugUploadController],
})
export class DebugModule {}