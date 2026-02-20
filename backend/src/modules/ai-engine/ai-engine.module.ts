import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiEngineService } from './ai-engine.service';
import { AiEngineController } from './ai-engine.controller';
import { PromptBuilderService } from './prompt-builder.service';
import { ReportGeneratorService } from './report-generator.service';
import { Insight } from './entities/insight.entity';
import { CollectedData } from '../data-collector/entities/collected-data.entity';
import { Endpoint } from '../endpoints/entities/endpoint.entity';
import { System } from '../systems/entities/system.entity';
import { User } from '../users/entities/user.entity';
import { AiLog } from './entities/ai-log.entity';
import { AiUsage } from './entities/ai-usage.entity';
import { LlmModule } from '../llm/llm.module';
import { EndpointsModule } from '../endpoints/endpoints.module';
import { SystemsModule } from '../systems/systems.module';
import { forwardRef } from '@nestjs/common'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Insight,
      CollectedData,
      Endpoint,
      System,
      User,
      AiLog,
      AiUsage,
    ]),
    LlmModule,
    LlmModule,
    forwardRef(() => EndpointsModule),
    forwardRef(() => SystemsModule),
  ],
  controllers: [AiEngineController],
  providers: [AiEngineService, PromptBuilderService, ReportGeneratorService],
  exports: [AiEngineService],
})
export class AiEngineModule {}

