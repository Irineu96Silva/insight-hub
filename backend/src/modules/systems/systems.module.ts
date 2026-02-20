import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemsService } from './systems.service';
import { SystemsController } from './systems.controller';
import { System } from './entities/system.entity';
import { SystemFilesController } from './system-files.controller';
import { SystemFilesService } from './system-files.service';
import { SystemFile } from './entities/system-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([System, SystemFile])],
  controllers: [SystemsController, SystemFilesController],
  providers: [SystemsService, SystemFilesService],
  exports: [SystemsService, SystemFilesService],
})
export class SystemsModule {}
