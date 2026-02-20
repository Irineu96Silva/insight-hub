import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataCollectorService } from './data-collector.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DataCollectorScheduler {
  private readonly logger = new Logger(DataCollectorScheduler.name);

  constructor(
    private readonly dataCollectorService: DataCollectorService,
    private readonly configService: ConfigService,
  ) {}

  // Run every hour by default if not configured differently
  // Actually, endpoints have individual crons, but we might have a master job
  // that runs and checks which endpoints to collect?
  // Or simply collects all active ones periodically.
  // The architecture suggests: `DATA_COLLECTOR_CRON=0 */6 * * *`
  // So let's use that env var.

  @Cron(process.env.DATA_COLLECTOR_CRON || CronExpression.EVERY_6_HOURS)
  async handleCron() {
    this.logger.debug('Iniciando cron job de coleta de dados...');
    try {
      await this.dataCollectorService.collectAll();
      this.logger.debug('Coleta de dados finalizada com sucesso.');
    } catch (error) {
      this.logger.error('Erro no cron job de coleta', error);
    }
  }
}
