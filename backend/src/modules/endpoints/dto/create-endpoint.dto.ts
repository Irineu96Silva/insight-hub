import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateEndpointDto {
  @IsUUID()
  @IsNotEmpty()
  system_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url_template: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  method?: string;

  @IsObject()
  @IsOptional()
  params_schema?: Record<string, any>;

  @IsObject()
  @IsOptional()
  response_mapping?: Record<string, any>;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  response_type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  schedule_cron?: string;
}
