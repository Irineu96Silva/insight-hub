import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EndpointsService } from './endpoints.service';
import { EndpointsController } from './endpoints.controller';
import { Endpoint } from './entities/endpoint.entity';
import { DataCollectorModule } from '../data-collector/data-collector.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Endpoint]),
    forwardRef(() => DataCollectorModule),
  ],
  controllers: [EndpointsController],
  providers: [EndpointsService],
  exports: [EndpointsService],
})
export class EndpointsModule {}
