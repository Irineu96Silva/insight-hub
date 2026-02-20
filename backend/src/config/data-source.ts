
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force IPv4 to avoid ENETUNREACH on IPv6 networks
if (require('dns').setDefaultResultOrder) {
  require('dns').setDefaultResultOrder('ipv4first');
}

// Carrega variáveis de ambiente do arquivo .env na raiz do monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL, // Prioriza URL completa se existir (Render/Supabase)
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // Migrations enabled
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/../modules/**/entities/*.entity.{ts,js}'],
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
  subscribers: [],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
