import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EndpointsService } from './endpoints.service';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { UpdateEndpointDto } from './dto/update-endpoint.dto';
import { TestEndpointDto } from './dto/test-endpoint.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('endpoints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DEV)
  create(@Body() createEndpointDto: CreateEndpointDto) {
    return this.endpointsService.create(createEndpointDto);
  }

  @Get()
  findAll() {
    return this.endpointsService.findAll();
  }

  @Get('system/:id')
  findBySystem(@Param('id') systemId: string) {
    return this.endpointsService.findBySystem(systemId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.endpointsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEndpointDto: any) {
    return this.endpointsService.update(id, updateEndpointDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.endpointsService.remove(id);
  }

  @Post(':id/test')
  @Roles(UserRole.ADMIN, UserRole.DEV)
  testEndpoint(
    @Param('id') id: string,
    @Body() testEndpointDto: TestEndpointDto,
  ) {
    return this.endpointsService.testEndpoint(id, testEndpointDto.params);
  }

  /**
   * Coleta dados do endpoint com cache inteligente.
   * Se já existem dados com mesmos params, retorna do cache.
   */
  @Post(':id/collect')
  @Roles(UserRole.ADMIN, UserRole.DEV)
  collectData(
    @Param('id') id: string,
    @Body() body: { params: Record<string, any> },
  ) {
    return this.endpointsService.collectWithCache(id, body.params || {});
  }

  /**
   * Retorna dados coletados de um endpoint.
   * Pode filtrar por parâmetros específicos via query string.
   */
  @Get(':id/data')
  getCollectedData(
    @Param('id') id: string,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    const params: Record<string, any> = {};
    if (mes) params.mes = Number(mes);
    if (ano) params.ano = Number(ano);

    return this.endpointsService.getCollectedData(
      id,
      Object.keys(params).length > 0 ? params : undefined,
    );
  }
}
