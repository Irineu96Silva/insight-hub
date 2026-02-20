import { DataSource } from 'typeorm';
import { LlmProvider } from '../../modules/llm/entities/llm-provider.entity';
import { encrypt } from '../../modules/llm/utils/crypto.util';

export const seedLlmProvider = async (dataSource: DataSource, jwtSecret = 'fallback-secret-key') => {
  const providerRepo = dataSource.getRepository(LlmProvider);

  // Verifica se já tem algum provider
  const count = await providerRepo.count();
  if (count > 0) {
    console.log('LLM Providers already exist - skipping seed');
    return;
  }

  // Pega do env direto, assumindo que foi carregado
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('OPENROUTER_API_KEY not found in .env - skipping LLM Provider seed');
    return;
  }

  const openRouter = providerRepo.create({
    name: 'OpenRouter (Auto)',
    slug: 'openrouter',
    base_url: 'https://openrouter.ai/api/v1',
    default_model: 'deepseek/deepseek-r1-0528:free',
    is_active: true,
    extra_config: {
      'HTTP-Referer': 'https://insighthub.com',
      'X-Title': 'InsightHub',
    },
  });

  // Encripta
  openRouter.api_key_encrypted = encrypt(apiKey, jwtSecret);

  await providerRepo.save(openRouter);
  console.log('OpenRouter provider seeded from .env');
};
