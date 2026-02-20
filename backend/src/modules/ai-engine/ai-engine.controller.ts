import { Controller, Post, Body, Get, Req, Res, Param, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AiEngineService } from './ai-engine.service';
import { ReportGeneratorService, type ReportFormat } from './report-generator.service';
import { InsightType } from './entities/insight.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('insights')
@UseGuards(JwtAuthGuard)
export class AiEngineController {
  constructor(
    private readonly aiEngineService: AiEngineService,
    private readonly reportGenerator: ReportGeneratorService,
  ) {}

  @Post('generate')
  async generate(
    @Body()
    body: {
      type: string;
      endpointId: string;
      params: any;
      context?: string;
      data?: any;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.aiEngineService.generateInsight(
      body.type as InsightType,
      body.data || {},
      body.context,
      userId,
    );
  }

  @Post('chat')
  async chat(
    @Body() body: { systemId: string; question: string; dataContext: any },
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const question = body.question.toLowerCase();

    // Detectar formato e tipo de relatório
    const reportType = this.detectReportType(question);

    if (reportType && body.systemId && body.systemId !== 'general') {
      try {
        // 1. Obter a resposta da IA primeiro
        const aiResponse = await this.aiEngineService.chat(
          body.systemId,
          body.question,
          body.dataContext,
          userId,
        );

        // 2. Gerar o relatório no formato detectado
        let result: { filename: string; filepath: string };

        if (reportType === 'docx') {
          // Word: inclui conteúdo da IA como corpo do documento
          result = await this.reportGenerator.generateWordReport(
            body.systemId,
            body.question,
            aiResponse, // Passa a resposta da IA para o corpo do Word
          );
        } else {
          // Excel: dados tabulares
          result = await this.reportGenerator.generateExcelReport(
            body.systemId,
            body.question,
          );
        }

        // 3. Retornar resposta com link de download
        return {
          response: aiResponse,
          report: {
            filename: result.filename,
            downloadUrl: `/insights/reports/download/${result.filename}`,
            format: reportType,
          },
        };
      } catch (err: any) {
        const aiResponse = await this.aiEngineService.chat(
          body.systemId,
          body.question,
          body.dataContext,
          userId,
        );
        return {
          response: aiResponse + '\n\n⚠️ Não foi possível gerar o arquivo: ' + (err.message || 'Erro desconhecido'),
        };
      }
    }

    // Chat normal (sem relatório)
    const response = await this.aiEngineService.chat(
      body.systemId,
      body.question,
      body.dataContext,
      userId,
    );
    return { response };
  }

  /**
   * Gerar relatório sob demanda (Excel ou Word).
   */
  @Post('reports/generate')
  async generateReport(
    @Body() body: { systemId: string; title?: string; format?: ReportFormat; aiContent?: string },
  ) {
    let result: { filename: string; filepath: string };

    if (body.format === 'docx') {
      result = await this.reportGenerator.generateWordReport(
        body.systemId,
        body.title,
        body.aiContent,
      );
    } else {
      result = await this.reportGenerator.generateExcelReport(
        body.systemId,
        body.title,
      );
    }

    return {
      filename: result.filename,
      downloadUrl: `/insights/reports/download/${result.filename}`,
      format: body.format || 'xlsx',
    };
  }

  /**
   * Download de relatório gerado.
   */
  @Get('reports/download/:filename')
  async downloadReport(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filepath = this.reportGenerator.getReportPath(filename);
    if (!filepath) {
      res.status(404).json({ message: 'Relatório não encontrado' });
      return;
    }

    // Content-type adequado
    const isDocx = filename.endsWith('.docx');
    const contentType = isDocx
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.download(filepath, filename);
  }

  /**
   * Listar relatórios gerados.
   */
  @Get('reports')
  async listReports() {
    return this.reportGenerator.listReports();
  }

  @Post('analyze')
  async analyzeCollectedData(
    @Body() body: { endpointId: string; params?: Record<string, any> },
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.aiEngineService.analyzeCollectedData(body.endpointId, body.params, userId);
  }

  @Post('cross-analyze')
  async crossAnalyze(
    @Body() body: { endpointIds: string[]; params?: Record<string, any> },
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.aiEngineService.crossAnalyze(body.endpointIds, body.params, userId);
  }

  @Post('global')
  async generateGlobal(
    @Body() body: { systemId?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.aiEngineService.generateGlobalInsight(body.systemId, userId);
  }

  @Get('health')
  getHealth() {
    return this.aiEngineService.getHealthStatus();
  }

  @Get()
  async findAll(@Req() req: any) {
    const systemId = req.query.systemId;
    return this.aiEngineService.findAll(systemId);
  }

  // ─── Helpers ───────────────────────────────────────────

  /**
   * Detecta se o usuário está pedindo um relatório e em qual formato.
   * Retorna null se não for um pedido de relatório.
   * Retorna 'docx' para Word ou 'xlsx' para Excel.
   */
  private detectReportType(question: string): ReportFormat | null {
    // Keywords para Word / Documento textual
    const wordKeywords = [
      'word', 'docx', 'documento word',
      'gere um documento', 'gerar documento',
      'relatório em word', 'relatorio em word',
      'insight em documento', 'insight em word',
      'gere um insight', 'gerar insight',
      'documento de análise', 'documento de analise',
    ];

    // Keywords para Excel / Planilha
    const excelKeywords = [
      'excel', 'xlsx', 'planilha',
      'relatório em excel', 'relatorio em excel',
      'exportar dados', 'exportar em excel',
      'gere uma planilha', 'gerar planilha',
    ];

    // Keywords genéricos de relatório
    const genericKeywords = [
      'relatório', 'relatorio', 'gere um relatório', 'gerar relatório',
      'gere o relatório', 'me gere', 'gere um arquivo',
      'exportar', 'download', 'extrair dados',
    ];

    // Prioridade: Word > Excel > Genérico (default Excel)
    if (wordKeywords.some(kw => question.includes(kw))) return 'docx';
    if (excelKeywords.some(kw => question.includes(kw))) return 'xlsx';
    if (genericKeywords.some(kw => question.includes(kw))) return 'xlsx'; // default Excel

    return null;
  }
}
