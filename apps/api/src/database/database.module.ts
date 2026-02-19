import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDb } from "@repo/database";

@Global()
@Module({
  providers: [
    {
      provide: "DB_CLIENT",
      useFactory: (configService: ConfigService) => {
        const url = configService.getOrThrow<string>("DATABASE_URL");
        return createDb(url);
      },
      inject: [ConfigService],
    },
  ],
  exports: ["DB_CLIENT"],
})
export class DatabaseModule {}
