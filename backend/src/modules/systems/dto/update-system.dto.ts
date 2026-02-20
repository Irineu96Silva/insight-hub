import { PartialType } from '@nestjs/mapped-types';
import { CreateSystemDto } from './create-system.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSystemDto extends PartialType(CreateSystemDto) {
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
