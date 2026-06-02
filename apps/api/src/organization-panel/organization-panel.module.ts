import { Module } from '@nestjs/common';
import { OrganizationPanelController } from './organization-panel.controller';
import { OrganizationPanelService } from './organization-panel.service';
import { MailModule } from '@repo/mail';

@Module({
  imports: [MailModule.forRoot()],
  controllers: [OrganizationPanelController],
  providers: [OrganizationPanelService],
  exports: [OrganizationPanelService],
})
export class OrganizationPanelModule {}
