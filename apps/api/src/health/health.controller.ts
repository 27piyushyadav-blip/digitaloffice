import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Public } from '../common/decorators/public.decorator';
import { sql } from 'drizzle-orm';

@Controller()
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Public()
  @Get('live')
  getLive() {
    return { status: 'OK' };
  }

  @Public()
  @Get('ready')
  async getReady() {
    try {
      // Check database connection by executing a lightweight query
      await this.databaseService.db.execute(sql`SELECT 1`);
      return { status: 'OK', database: 'healthy' };
    } catch (error: any) {
      throw new ServiceUnavailableException({
        status: 'Unhealthy',
        database: 'unhealthy',
        error: error.message,
      });
    }
  }
}
