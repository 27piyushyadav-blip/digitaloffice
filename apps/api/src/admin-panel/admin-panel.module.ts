import { Module } from '@nestjs/common';
import { AdminPanelController } from './admin-panel.controller';
import { AdminPanelService } from './admin-panel.service';

@Module({
  controllers: [AdminPanelController],
  providers: [AdminPanelService],
  exports: [AdminPanelService],
})
export class AdminPanelModule {}
