import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { LlmService } from './llm.service';
import { LLM_PROVIDER_PRESETS } from './adapters/adapter.factory';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  /** Lista todos os provedores cadastrados */
  @Get('providers')
  findAll() {
    return this.llmService.findAll();
  }

  /** Retorna os presets de provedores disponíveis */
  @Get('presets')
  getPresets() {
    return LLM_PROVIDER_PRESETS;
  }

  /** Cria um novo provedor */
  @Post('providers')
  create(
    @Body()
    body: {
      name: string;
      slug: string;
      base_url: string;
      api_key?: string;
      default_model: string;
      is_active?: boolean;
      extra_config?: Record<string, any>;
    },
  ) {
    return this.llmService.create(body);
  }

  /** Atualiza um provedor existente */
  @Put('providers/:id')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      base_url: string;
      api_key: string;
      default_model: string;
      extra_config: Record<string, any>;
    }>,
  ) {
    return this.llmService.update(id, body);
  }

  /** Remove um provedor (não pode ser o ativo) */
  @Delete('providers/:id')
  remove(@Param('id') id: string) {
    return this.llmService.remove(id);
  }

  /** Ativa um provedor (desativa os demais) */
  @Patch('providers/:id/activate')
  activate(@Param('id') id: string) {
    return this.llmService.activate(id);
  }

  /** Testa a conexão com um provedor */
  @Post('providers/:id/test')
  testConnection(@Param('id') id: string) {
    return this.llmService.testConnection(id);
  }

  /** Lista modelos disponíveis de um provedor */
  @Get('providers/:id/models')
  listModels(@Param('id') id: string) {
    return this.llmService.listModels(id);
  }
}
