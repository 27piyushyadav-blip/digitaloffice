import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { DirectoryService } from './directory.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('directory')
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @Public()
  @Get('experts')
  async getLiveExperts() {
    return this.directoryService.getLiveExperts();
  }

  @Public()
  @Get('experts/:id')
  async getLiveExpertById(@Param('id') id: string) {
    const expert = await this.directoryService.getLiveExpertById(id);
    if (!expert) {
        throw new NotFoundException('Expert not found or not currently live');
    }
    return expert;
  }

  @Public()
  @Get('organizations')
  async getLiveOrganizations() {
    return this.directoryService.getLiveOrganizations();
  }

  @Public()
  @Get('organizations/:id')
  async getLiveOrganizationById(@Param('id') id: string) {
    const org = await this.directoryService.getLiveOrganizationById(id);
    if (!org) {
        throw new NotFoundException('Organization not found or not currently live');
    }
    return org;
  }
}
