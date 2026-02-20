
import { Controller, Post, Res, HttpStatus, Logger, Headers, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { seedAdminUser } from '../../database/seeds/admin-user.seed';
import { seedCrmMenu } from '../../database/seeds/crmmenu-system.seed';
import { seedLlmProvider } from '../../database/seeds/llm-provider.seed';
import { Response } from 'express';

@Controller('seeder')
export class SeederController {
  private readonly logger = new Logger(SeederController.name);

  constructor(private dataSource: DataSource) {}

  @Post('run')
  async runSeeds(@Headers('x-seed-secret') secret: string, @Res() res: Response) {
    // Basic protection: match JWT_SECRET or a specific SEED_SECRET
    const allowedSecret = process.env.JWT_SECRET || 'fallback-secret';
    
    if (secret !== allowedSecret) {
        throw new UnauthorizedException('Invalid Seed Secret');
    }

    try {
      this.logger.log('Starting seed process via HTTP...');
      
      const log = [];
      
      await seedAdminUser(this.dataSource);
      log.push('Admin User: Seeded or Checked');

      await seedCrmMenu(this.dataSource);
      log.push('CRM Menu: Seeded or Checked');

      // Use JWT_SECRET for encryption
      await seedLlmProvider(this.dataSource, process.env.JWT_SECRET || 'fallback-secret');
      log.push('LLM Provider: Seeded or Checked');

      return res.status(HttpStatus.OK).json({
        message: 'Seeds executed successfully',
        details: log
      });
    } catch (error) {
      this.logger.error('Error running seeds', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error running seeds',
        error: error.message
      });
    }
  }
}
