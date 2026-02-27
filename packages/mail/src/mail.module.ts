import { Module, DynamicModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MailService } from "./mail.service";

@Module({})
export class MailModule {
  static forRoot(): DynamicModule {
    return {
      module: MailModule,
      imports: [ConfigModule],
      providers: [MailService],
      exports: [MailService],
    };
  }
}
