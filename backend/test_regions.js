const { Client } = require('pg');
require('dotenv').config();

const regions = [
  'dhizxlncgkbvcrmdqixl.supabase.co',
  'aws-0-sa-east-1.pooler.supabase.com'
];


async function testConnection(host, port = 5432) {
  const client = new Client({
    host: host,
    port: port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  console.log(`Testing connection to: ${host}:${port} with user: ${process.env.DB_USER}`);
  try {
    await client.connect();
    console.log(`SUCCESS: Connected to ${host}:${port}!`);
    await client.end();
    return true;
  } catch (err) {
    console.error(`FAILED: ${host}:${port} - ${err.code || 'UNKNOWN'} - ${err.message}`);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

(async () => {
  const configs = [
    { host: 'aws-0-sa-east-1.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-us-east-1.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-us-east-2.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-us-west-1.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-us-west-2.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-ca-central-1.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-eu-west-1.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-eu-west-2.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-eu-west-3.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-eu-north-1.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-ap-southeast-1.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-ap-southeast-2.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-ap-northeast-1.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-ap-northeast-2.pooler.supabase.com', port: 5432 },
    { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 5432 }
  ];

  for (const config of configs) {
    if (await testConnection(config.host, config.port)) {
      console.log(`Found working config: ${config.host}:${config.port}`);
      // process.exit(0); // Don't exit early, see all results
    }
  }
})();
