import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { NetworkTestsService } from './network-tests.service';
import { NetworkTestType } from './entities/network-test.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('network-tests')
@UseGuards(JwtAuthGuard)
export class NetworkTestsController {
  constructor(private readonly networkTestsService: NetworkTestsService) {}

  /**
   * Roda bateria completa de testes para um sistema.
   */
  @Post(':systemId/run')
  async runAll(@Param('systemId') systemId: string) {
    return this.networkTestsService.runAllTests(systemId);
  }

  /**
   * Roda teste individual.
   */
  @Post(':systemId/run/:type')
  async runSingle(
    @Param('systemId') systemId: string,
    @Param('type') type: string,
  ) {
    const testType = type.toUpperCase() as NetworkTestType;
    return this.networkTestsService.runSingleTest(systemId, testType);
  }

  /**
   * Histórico de testes de um sistema.
   */
  @Get(':systemId/history')
  async getHistory(
    @Param('systemId') systemId: string,
    @Query('limit') limit?: string,
  ) {
    return this.networkTestsService.getHistory(systemId, limit ? parseInt(limit) : 50);
  }

  /**
   * Último resultado de cada tipo.
   */
  @Get(':systemId/latest')
  async getLatest(@Param('systemId') systemId: string) {
    return this.networkTestsService.getLatest(systemId);
  }
}
