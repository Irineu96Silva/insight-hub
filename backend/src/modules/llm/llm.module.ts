import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmProvider } from './entities/llm-provider.entity';
import { LlmService } from './llm.service';
import { LlmGatewayService } from './llm-gateway.service';
import { LlmController } from './llm.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LlmProvider])],
  controllers: [LlmController],
  providers: [LlmService, LlmGatewayService],
  exports: [LlmGatewayService, LlmService],
})
export class LlmModule {}
