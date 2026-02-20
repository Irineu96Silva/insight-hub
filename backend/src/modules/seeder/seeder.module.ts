
import { Module } from '@nestjs/common';
import { SeederController } from './seeder.controller';

@Module({
  controllers: [SeederController],
})
export class SeederModule {}
