import { Module } from "@nestjs/common";
import { APP_PIPE, APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ZodValidationPipe } from "nestjs-zod";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { AtGuard } from "./auth/guards/at.guard";
import { ExpertModule } from "./expert/expert.module";
import { VerificationModule } from "./verification/verification.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { AvailabilityModule } from "./availability/availability.module";
import { BookingsModule } from "./bookings/bookings.module";
import { SessionsModule } from "./sessions/sessions.module";
import { EarningsModule } from "./earnings/earnings.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { UsersModule } from "./users/users.module";
import { PaymentsModule } from "./payments/payments.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { ChatModule } from "./chat/chat.module";
import { OrganizationPanelModule } from "./organization-panel/organization-panel.module";
import { AdminPanelModule } from "./admin-panel/admin-panel.module";
import { DirectoryModule } from "./directory/directory.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ExpertModule,
    VerificationModule,
    OrganizationsModule,
    AvailabilityModule,
    BookingsModule,
    SessionsModule,
    EarningsModule,
    NotificationsModule,
    UsersModule,
    PaymentsModule,
    ReviewsModule,
    ChatModule,
    OrganizationPanelModule,
    AdminPanelModule,
    DirectoryModule,
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
