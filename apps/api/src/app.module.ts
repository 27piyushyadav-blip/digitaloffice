import { Module } from "@nestjs/common";
import { APP_PIPE, APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ZodValidationPipe } from "nestjs-zod";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { AtGuard } from "./auth/guards/at.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
  ],
})
export class AppModule {}
