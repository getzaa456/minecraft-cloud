import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

const schema = `
CREATE TABLE IF NOT EXISTS minecraft_servers (
  id UUID PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  container_id VARCHAR(128) UNIQUE,
  container_name VARCHAR(128),
  port INTEGER UNIQUE,
  version VARCHAR(32) NOT NULL DEFAULT 'LATEST',
  memory_mb INTEGER NOT NULL CHECK (memory_mb >= 512),
  cpu NUMERIC(5,2) NOT NULL CHECK (cpu >= 0.25),
  max_players INTEGER NOT NULL CHECK (max_players BETWEEN 1 AND 100),
  volume VARCHAR(128),
  status VARCHAR(24) NOT NULL DEFAULT 'provisioning',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_minecraft_servers_status
  ON minecraft_servers(status);
`;

export async function initDatabase() {
  await pool.query(schema);
}

export async function pingDatabase() {
  await pool.query('SELECT 1');
}

export async function closeDatabase() {
  await pool.end();
}
