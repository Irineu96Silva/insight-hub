import 'dotenv/config'; // Garante que variáveis .env sejam carregadas
import { seedAdminUser } from './database/seeds/admin-user.seed';
import { seedCrmMenu } from './database/seeds/crmmenu-system.seed';
import { seedLlmProvider } from './database/seeds/llm-provider.seed';
import { AppDataSource } from './config/data-source';

async function runSeed() {
  const dataSource = AppDataSource;
  
  try {
    await dataSource.initialize();
    console.log('📦 Data Source initialized for seeding');

    await seedAdminUser(dataSource);
    await seedCrmMenu(dataSource);
    
    // Seed LLM Provider usando variáveis de ambiente
    await seedLlmProvider(dataSource, process.env.JWT_SECRET);

    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

runSeed();
