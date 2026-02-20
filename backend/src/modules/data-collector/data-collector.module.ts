import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataCollectorService } from './data-collector.service';
import { DataCollectorScheduler } from './data-collector.scheduler';
import { DataCollectorController } from './data-collector.controller';
import { CollectedData } from './entities/collected-data.entity';
import { Endpoint } from '../endpoints/entities/endpoint.entity';
import { System } from '../systems/entities/system.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([CollectedData, Endpoint, System])],
  controllers: [DataCollectorController],
  providers: [DataCollectorService, DataCollectorScheduler],
  exports: [DataCollectorService],
})
export class DataCollectorModule {}
