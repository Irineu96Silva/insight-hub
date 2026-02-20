import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { AuthType } from '../entities/system.entity';

export class CreateSystemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  base_url?: string;

  @IsEnum(AuthType)
  @IsOptional()
  auth_type?: AuthType;

  @IsObject()
  @IsOptional()
  auth_config?: Record<string, any>;
}
