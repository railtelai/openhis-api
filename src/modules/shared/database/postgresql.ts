import { Pool } from 'pg';

const connectionString = process.env.DATABASE_CONNECTION_STRING;

const pool = new Pool({
  connectionString,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool;
