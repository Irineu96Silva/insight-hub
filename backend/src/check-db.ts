
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function check() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to Database');
    
    const version = await AppDataSource.query('SELECT version()');
    console.log('📌 Postgres Version:', version[0].version);

    const extensions = await AppDataSource.query('SELECT * FROM pg_extension');
    console.log('📌 Installed Extensions:', extensions.map((e: any) => e.extname).join(', '));

    const uuidFunc = await AppDataSource.query("SELECT exists(SELECT * FROM pg_proc WHERE proname = 'uuid_generate_v4')");
    console.log('📌 uuid_generate_v4 exists:', uuidFunc[0].exists);

    const genRandomFunc = await AppDataSource.query("SELECT exists(SELECT * FROM pg_proc WHERE proname = 'gen_random_uuid')");
    console.log('📌 gen_random_uuid exists:', genRandomFunc[0].exists);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

check();
