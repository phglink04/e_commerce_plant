import { Module } from "@nestjs/common";
import { SupabaseStorageService } from "./supabase-storage.service";
import { MailService } from "./mail.service";
import { TurnstileService } from "./turnstile.service";

@Module({
  providers: [SupabaseStorageService, MailService, TurnstileService],
  exports: [SupabaseStorageService, MailService, TurnstileService],
})
export class HelpersModule {}
