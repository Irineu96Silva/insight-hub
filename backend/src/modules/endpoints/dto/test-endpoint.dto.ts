import { IsNotEmpty, IsObject } from 'class-validator';

export class TestEndpointDto {
  @IsObject()
  @IsNotEmpty()
  params: Record<string, any>;
}
