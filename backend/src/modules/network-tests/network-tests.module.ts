import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworkTest } from './entities/network-test.entity';
import { System } from '../systems/entities/system.entity';
import { NetworkTestsService } from './network-tests.service';
import { NetworkTestsController } from './network-tests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NetworkTest, System])],
  controllers: [NetworkTestsController],
  providers: [NetworkTestsService],
  exports: [NetworkTestsService],
})
export class NetworkTestsModule {}
