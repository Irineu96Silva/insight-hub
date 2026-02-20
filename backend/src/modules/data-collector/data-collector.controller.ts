import { Controller, Post, Get, Param, Body, Res, Query, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { DataCollectorService } from './data-collector.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('data-collector')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataCollectorController {
  constructor(private readonly dataCollectorService: DataCollectorService) {}

  @Post('collect/:id')
  @Roles(UserRole.ADMIN, UserRole.DEV)
  async collect(@Param('id') id: string, @Body() body: any) {
    const params = body.params || {};
    return this.dataCollectorService.collectFromEndpoint(id, params);
  }

  @Post('collect-all')
  @Roles(UserRole.ADMIN, UserRole.DEV)
  async collectAll(@Body() body: any) {
    const { mes, ano } = body;
    return this.dataCollectorService.collectAll(mes, ano);
  }

  /**
   * Lista todos os dados coletados de um sistema específico.
   */
  @Get('system/:systemId')
  async getBySystem(
    @Param('systemId') systemId: string,
    @Query('limit') limit?: string,
  ) {
    return this.dataCollectorService.getDataBySystem(systemId, Number(limit) || 50);
  }

  /**
   * Retorna um dado coletado específico pelo ID.
   */
  @Get('item/:id')
  async getOne(@Param('id') id: string) {
    return this.dataCollectorService.getDataById(id);
  }

  /**
   * Download de um dado coletado como CSV.
   */
  @Get('download/:id/csv')
  async downloadCsv(@Param('id') id: string, @Res() res: Response) {
    const data = await this.dataCollectorService.getDataById(id);
    if (!data) {
      res.status(404).json({ message: 'Dado não encontrado' });
      return;
    }

    let csvContent: string;
    if (data.csv_raw) {
      csvContent = data.csv_raw;
    } else if (data.raw_data) {
      csvContent = this.jsonToCsv(data.raw_data);
    } else {
      res.status(404).json({ message: 'Sem dados para download' });
      return;
    }

    const filename = `coleta_${data.endpoint?.name || 'dados'}_${new Date(data.collected_at).toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csvContent); // BOM for Excel
  }

  /**
   * Download de um dado coletado como JSON.
   */
  @Get('download/:id/json')
  async downloadJson(@Param('id') id: string, @Res() res: Response) {
    const data = await this.dataCollectorService.getDataById(id);
    if (!data) {
      res.status(404).json({ message: 'Dado não encontrado' });
      return;
    }

    const filename = `coleta_${data.endpoint?.name || 'dados'}_${new Date(data.collected_at).toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data.raw_data, null, 2));
  }

  // ── Helpers ──

  private jsonToCsv(data: any): string {
    if (!Array.isArray(data) || data.length === 0) {
      return JSON.stringify(data, null, 2);
    }

    const headers = Object.keys(data[0]);
    const rows = data.map((item: any) =>
      headers.map((h) => {
        const val = item[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(';') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(';')
    );

    return [headers.join(';'), ...rows].join('\n');
  }
}
