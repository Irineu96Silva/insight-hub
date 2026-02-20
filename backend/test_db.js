const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

console.log('Connecting to:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    return client.end();
  })
  .catch(err => {
    console.error('Connection error MESSAGE:', err.message);
    console.error('Connection error CODE:', err.code);
    process.exit(1);
  });
