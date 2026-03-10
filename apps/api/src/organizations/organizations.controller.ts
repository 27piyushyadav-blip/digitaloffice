import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { GetCurrentUserId } from '../common/decorators';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async listOrganizations(@Query('search') search?: string) {
    return this.organizationsService.listOrganizations(search);
  }

  @Post('experts/organization/request')
  async requestToJoinOrganization(
    @GetCurrentUserId() expertId: string,
    @Body() body: { organizationId: string },
  ) {
    const { organizationId } = body;
    
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    return this.organizationsService.requestToJoin(expertId, organizationId);
  }

  @Delete('experts/organization/request/:requestId')
  async cancelJoinRequest(
    @GetCurrentUserId() expertId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.organizationsService.cancelJoinRequest(expertId, requestId);
  }

  @Get('experts/organizations')
  async getMyOrganizations(@GetCurrentUserId() expertId: string) {
    return this.organizationsService.getMyOrganizations(expertId);
  }

  @Delete('experts/organizations/:organizationId')
  async leaveOrganization(
    @GetCurrentUserId() expertId: string,
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationsService.leaveOrganization(expertId, organizationId);
  }
}
