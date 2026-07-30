import { Module } from '@nestjs/common';
import { OrganizationPanelController } from './organization-panel.controller';
import { OrganizationPanelService } from './organization-panel.service';
import { MailModule } from '@repo/mail';

import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [MailModule.forRoot(), PaymentsModule],
  controllers: [OrganizationPanelController],
  providers: [OrganizationPanelService],
  exports: [OrganizationPanelService],
})
export class OrganizationPanelModule {}
