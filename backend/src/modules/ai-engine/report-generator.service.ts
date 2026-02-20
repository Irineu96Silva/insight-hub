import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageBreak,
} from 'docx';
// import * as path from 'path'; // Removed/Commented
// import * as fs from 'fs'; 
import { CollectedData, CollectionStatus } from '../data-collector/entities/collected-data.entity';
import { Endpoint } from '../endpoints/entities/endpoint.entity';
import { StorageService } from '../storage/storage.service';

export type ReportFormat = 'xlsx' | 'docx';

@Injectable()
export class ReportGeneratorService {
  private readonly logger = new Logger(ReportGeneratorService.name);
  private readonly REPORTS_PATH = 'reports';

  constructor(
    @InjectRepository(CollectedData)
    private collectedDataRepo: Repository<CollectedData>,
    @InjectRepository(Endpoint)
    private endpointRepo: Repository<Endpoint>,
    private storageService: StorageService,
  ) {}

  // ═══════════════════════════════════════════════════════
  //  DADOS COMPARTILHADOS
  // ═══════════════════════════════════════════════════════

  private async getSystemData(systemId: string) {
    const endpoints = await this.endpointRepo.find({
      where: { system_id: systemId, is_active: true },
      relations: ['system'],
    });

    if (endpoints.length === 0) {
      throw new Error('Nenhum endpoint encontrado para este sistema.');
    }

    const systemName = endpoints[0]?.system?.name || 'Sistema';

    const endpointsData: Array<{
      endpoint: Endpoint;
      collections: CollectedData[];
    }> = [];

    for (const endpoint of endpoints) {
      const collections = await this.collectedDataRepo.find({
        where: {
          endpoint_id: endpoint.id,
          status: CollectionStatus.SUCCESS,
        },
        order: { collected_at: 'DESC' },
        take: 5,
      });
      if (collections.length > 0) {
        endpointsData.push({ endpoint, collections });
      }
    }

    return { systemName, endpoints, endpointsData };
  }

  // ═══════════════════════════════════════════════════════
  //  GERAÇÃO EXCEL (.xlsx)
  // ═══════════════════════════════════════════════════════

  async generateExcelReport(
    systemId: string,
    title?: string,
  ): Promise<{ filename: string; filepath: string }> {
    const { systemName, endpoints, endpointsData } = await this.getSystemData(systemId);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `relatorio_${systemName.replace(/\s+/g, '_').toLowerCase()}_${timestamp}.xlsx`;
    const relativePath = `${this.REPORTS_PATH}/${filename}`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'InsightHub AI';
    workbook.created = new Date();

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0E7490' },
    };
    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FFFFFF' },
      size: 11,
    };

    for (const { endpoint, collections } of endpointsData) {
      const sheetName = endpoint.name.substring(0, 31).replace(/[\\/*?[\]]/g, '');
      const sheet = workbook.addWorksheet(sheetName);

      for (const coleta of collections) {
        const data = coleta.raw_data;
        const params = coleta.params_used || {};
        const periodLabel = params.mes && params.ano ? `${params.mes}/${params.ano}` : 'Último';

        const titleRow = sheet.addRow([`Coleta: ${periodLabel} — ${new Date(coleta.collected_at).toLocaleString('pt-BR')}`]);
        titleRow.font = { bold: true, size: 12, color: { argb: '0E7490' } };
        sheet.addRow([]);

        if (Array.isArray(data) && data.length > 0) {
          const keys = Object.keys(data[0]);
          const hr = sheet.addRow(keys);
          hr.eachCell((cell) => { cell.fill = headerFill; cell.font = headerFont; cell.alignment = { horizontal: 'center' }; });
          for (const item of data) {
            sheet.addRow(keys.map(k => typeof item[k] === 'object' ? JSON.stringify(item[k]) : item[k]));
          }
          keys.forEach((_, idx) => {
            let maxLen = keys[idx].length;
            data.forEach((item: any) => { const v = String(item[keys[idx]] || ''); if (v.length > maxLen) maxLen = Math.min(v.length, 50); });
            sheet.getColumn(idx + 1).width = maxLen + 4;
          });
        } else if (typeof data === 'object' && data !== null) {
          const hr = sheet.addRow(['Campo', 'Valor']);
          hr.eachCell((cell) => { cell.fill = headerFill; cell.font = headerFont; });
          for (const [key, value] of Object.entries(data)) {
            sheet.addRow([key, typeof value === 'object' ? JSON.stringify(value) : value]);
          }
          sheet.getColumn(1).width = 30; sheet.getColumn(2).width = 60;
        } else if (coleta.csv_raw) {
          const lines = coleta.csv_raw.split('\n').filter((l: string) => l.trim());
          if (lines.length > 0) {
            const hr = sheet.addRow(lines[0].split(','));
            hr.eachCell((cell) => { cell.fill = headerFill; cell.font = headerFont; });
            for (let i = 1; i < lines.length; i++) { sheet.addRow(lines[i].split(',')); }
          }
        }
        sheet.addRow([]); sheet.addRow([]);
      }
    }

    // Resumo
    const resumo = workbook.addWorksheet('Resumo');
    resumo.addRow(['Relatório InsightHub']).font = { bold: true, size: 16, color: { argb: '0E7490' } } as any;
    resumo.addRow([`Sistema: ${systemName}`]);
    resumo.addRow([`Gerado em: ${new Date().toLocaleString('pt-BR')}`]);
    resumo.addRow([`Total de endpoints: ${endpoints.length}`]);
    resumo.addRow([]);
    resumo.addRow([title || 'Relatório gerado automaticamente pelo InsightHub AI']);
    resumo.getColumn(1).width = 60;

    // Save to buffer then Storage
    const buffer = await workbook.xlsx.writeBuffer();
    await this.storageService.save(relativePath, (buffer as any) as Buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    this.logger.log(`Relatório Excel gerado no Storage: ${relativePath}`);
    // Retornamos filepath como o path relativo para consistência, ou usamos getUrl se precisarmos link
    return { filename, filepath: relativePath };
  }

  // ═══════════════════════════════════════════════════════
  //  GERAÇÃO WORD (.docx)
  // ═══════════════════════════════════════════════════════

  async generateWordReport(
    systemId: string,
    title?: string,
    aiContent?: string,
  ): Promise<{ filename: string; filepath: string }> {
    const { systemName, endpoints, endpointsData } = await this.getSystemData(systemId);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `insight_${systemName.replace(/\s+/g, '_').toLowerCase()}_${timestamp}.docx`;
    const relativePath = `${this.REPORTS_PATH}/${filename}`;

    const children: any[] = [];

    // ─── Capa ────────────────────────────────────────
    children.push(
      new Paragraph({ spacing: { after: 600 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: 'InsightHub',
            bold: true,
            size: 56,
            color: '0E7490',
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'Relatório de Inteligência',
            bold: true,
            size: 36,
            color: '334155',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: title || `Análise do Sistema ${systemName}`,
            size: 24,
            color: '64748B',
            italics: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({ text: `Sistema: `, size: 22, color: '475569' }),
          new TextRun({ text: systemName, size: 22, bold: true, color: '0E7490' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
            size: 20,
            color: '94A3B8',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Endpoints analisados: ${endpoints.length}`,
            size: 20,
            color: '94A3B8',
          }),
        ],
      }),
    );

    // ─── Conteúdo da IA (se disponível) ──────────────
    if (aiContent) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: '📊 Análise de Inteligência',
              bold: true,
              size: 32,
              color: '0E7490',
            }),
          ],
        }),
      );

      // Converter o conteúdo markdown da IA em parágrafos Word
      const aiParagraphs = this.markdownToDocxParagraphs(aiContent);
      children.push(...aiParagraphs);
    }

    // ─── Seções por Endpoint ─────────────────────────
    if (endpointsData.length > 0) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: '📋 Dados Coletados por Endpoint',
              bold: true,
              size: 32,
              color: '0E7490',
            }),
          ],
        }),
      );

      for (const { endpoint, collections } of endpointsData) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({
                text: `🔗 ${endpoint.name}`,
                bold: true,
                size: 26,
                color: '334155',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: endpoint.url_template || '',
                size: 18,
                color: '94A3B8',
                italics: true,
              }),
            ],
          }),
        );

        for (const coleta of collections) {
          const data = coleta.raw_data;
          const params = coleta.params_used || {};
          const periodLabel = params.mes && params.ano ? `${params.mes}/${params.ano}` : 'Último';

          children.push(
            new Paragraph({
              spacing: { before: 100, after: 100 },
              children: [
                new TextRun({ text: `Período: ${periodLabel}`, bold: true, size: 20, color: '475569' }),
                new TextRun({ text: `  |  Coletado em: ${new Date(coleta.collected_at).toLocaleString('pt-BR')}`, size: 18, color: '94A3B8' }),
              ],
            }),
          );

          // Criar tabela se for array de objetos
          if (Array.isArray(data) && data.length > 0) {
            const keys = Object.keys(data[0]);
            const table = this.createDocxTable(keys, data.slice(0, 50)); // Max 50 linhas
            children.push(table);
            if (data.length > 50) {
              children.push(
                new Paragraph({
                  spacing: { before: 50 },
                  children: [
                    new TextRun({ text: `... e mais ${data.length - 50} registros`, size: 18, color: '94A3B8', italics: true }),
                  ],
                }),
              );
            }
          } else if (typeof data === 'object' && data !== null) {
            const entries = Object.entries(data);
            const table = this.createDocxTable(
              ['Campo', 'Valor'],
              entries.map(([k, v]) => ({ Campo: k, Valor: typeof v === 'object' ? JSON.stringify(v) : String(v) })),
            );
            children.push(table);
          }

          children.push(new Paragraph({ spacing: { after: 200 } }));
        }
      }
    }

    // ─── Criar documento ─────────────────────────────
    const doc = new Document({
      creator: 'InsightHub AI',
      title: title || `Relatório ${systemName}`,
      description: `Relatório gerado automaticamente pelo InsightHub AI para o sistema ${systemName}`,
      sections: [
        {
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: 'InsightHub AI', size: 16, color: '94A3B8', italics: true }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: `Gerado em ${new Date().toLocaleString('pt-BR')} | InsightHub`, size: 14, color: '94A3B8' }),
                  ],
                }),
              ],
            }),
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    await this.storageService.save(relativePath, buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    this.logger.log(`Relatório Word gerado no Storage: ${relativePath}`);

    return { filename, filepath: relativePath };
  }

  // ═══════════════════════════════════════════════════════
  //  HELPERS & UTILITÁRIOS
  // ═══════════════════════════════════════════════════════

  /**
   * Verifica se o relatório existe e retorna o path (relativo ou url).
   */
  async getReportPath(filename: string): Promise<string | null> {
    const relativePath = `${this.REPORTS_PATH}/${filename}`;
    const exists = await this.storageService.exists(relativePath);
    if (!exists) return null;
    return relativePath; // Ou this.storageService.getUrl(relativePath) se quiser URL pública
  }

  async getReportContent(filename: string): Promise<Buffer | null> {
    const relativePath = `${this.REPORTS_PATH}/${filename}`;
    const exists = await this.storageService.exists(relativePath);
    if (!exists) return null;
    return this.storageService.read(relativePath);
  }

  async listReports(): Promise<Array<{ filename: string; size: number; created: Date; format: ReportFormat }>> {
    const files = await this.storageService.list(this.REPORTS_PATH);
    
    return files
      .filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.docx'))
      .map(f => ({
        filename: f.name,
        size: f.size,
        created: f.lastModified,
        format: (f.name.endsWith('.docx') ? 'docx' : 'xlsx') as ReportFormat,
      }))
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  // ═══════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════

  /**
   * Converte texto markdown simples em parágrafos docx.
   */
  private markdownToDocxParagraphs(md: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const lines = md.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        paragraphs.push(new Paragraph({ spacing: { after: 100 } }));
        continue;
      }

      // Heading
      if (trimmed.startsWith('### ')) {
        paragraphs.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: trimmed.replace('### ', ''), bold: true, size: 22, color: '334155' })],
        }));
      } else if (trimmed.startsWith('## ')) {
        paragraphs.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
          children: [new TextRun({ text: trimmed.replace('## ', ''), bold: true, size: 26, color: '0E7490' })],
        }));
      } else if (trimmed.startsWith('# ')) {
        paragraphs.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({ text: trimmed.replace('# ', ''), bold: true, size: 32, color: '0E7490' })],
        }));
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Bullet
        const text = trimmed.replace(/^[-*]\s/, '');
        paragraphs.push(new Paragraph({
          spacing: { after: 50 },
          children: this.parseInlineMarkdown('• ' + text, 20),
        }));
      } else if (/^\d+\.\s/.test(trimmed)) {
        // Numbered list
        paragraphs.push(new Paragraph({
          spacing: { after: 50 },
          children: this.parseInlineMarkdown(trimmed, 20),
        }));
      } else {
        // Normal paragraph
        paragraphs.push(new Paragraph({
          spacing: { after: 100 },
          children: this.parseInlineMarkdown(trimmed, 20),
        }));
      }
    }

    return paragraphs;
  }

  /**
   * Faz parse de **bold** e texto normal dentro de uma linha.
   */
  private parseInlineMarkdown(text: string, size: number): TextRun[] {
    const runs: TextRun[] = [];
    const parts = text.split(/(\*\*.*?\*\*)/g);

    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        runs.push(new TextRun({
          text: part.slice(2, -2),
          bold: true,
          size,
          color: '1E293B',
        }));
      } else {
        runs.push(new TextRun({
          text: part,
          size,
          color: '334155',
        }));
      }
    }

    return runs;
  }

  /**
   * Cria uma tabela docx a partir de colunas e dados.
   */
  private createDocxTable(columns: string[], rows: any[]): Table {
    const headerCells = columns.map(col =>
      new TableCell({
        shading: { type: ShadingType.SOLID, color: '0E7490' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: col, bold: true, size: 18, color: 'FFFFFF' })],
          }),
        ],
      }),
    );

    const dataRows = rows.map((item, idx) =>
      new TableRow({
        children: columns.map(col =>
          new TableCell({
            shading: idx % 2 === 0
              ? { type: ShadingType.SOLID, color: 'F8FAFC' }
              : undefined,
              children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: String(item[col] ?? ''),
                    size: 16,
                    color: '475569',
                  }),
                ],
              }),
            ],
          }),
        ),
      }),
    );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: headerCells }),
        ...dataRows,
      ],
    });
  }
}
