import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { SystemsService } from './systems.service';
import { CreateSystemDto } from './dto/create-system.dto';
import { UpdateSystemDto } from './dto/update-system.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('systems')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemsController {
  constructor(private readonly systemsService: SystemsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DEV)
  create(@Body() createSystemDto: CreateSystemDto) {
    return this.systemsService.create(createSystemDto);
  }

  @Get()
  findAll() {
    return this.systemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.systemsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSystemDto: any) {
    return this.systemsService.update(id, updateSystemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.systemsService.remove(id);
  }
}
