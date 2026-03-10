import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDb } from "@repo/database";
import { DatabaseService } from "./database.service";

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
    DatabaseService,
  ],
  exports: ["DB_CLIENT", DatabaseService],
})
export class DatabaseModule {}
