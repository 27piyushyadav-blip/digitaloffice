import { Module } from '@nestjs/common';
import { OrganizationPanelController } from './organization-panel.controller';
import { OrganizationPanelService } from './organization-panel.service';

@Module({
  controllers: [OrganizationPanelController],
  providers: [OrganizationPanelService],
  exports: [OrganizationPanelService],
})
export class OrganizationPanelModule {}
