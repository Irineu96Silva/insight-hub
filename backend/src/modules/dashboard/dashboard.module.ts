import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AiEngineModule } from '../ai-engine/ai-engine.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Insight } from '../ai-engine/entities/insight.entity';
import { AiLog } from '../ai-engine/entities/ai-log.entity';
import { AiUsage } from '../ai-engine/entities/ai-usage.entity';
import { Endpoint } from '../endpoints/entities/endpoint.entity';
import { System } from '../systems/entities/system.entity';
import { CollectedData } from '../data-collector/entities/collected-data.entity';

@Module({
  imports: [
    AiEngineModule,
    TypeOrmModule.forFeature([Insight, AiLog, AiUsage, Endpoint, System, CollectedData]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
