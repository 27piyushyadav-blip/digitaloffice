import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { MailModule } from '@repo/mail';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [MailModule.forRoot(), PaymentsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

