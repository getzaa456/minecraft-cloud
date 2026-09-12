import { pool } from './database.js';

const mapRow = (row) => ({
  id: row.id,
  name: row.name,
  status: row.status,
  containerId: row.container_id,
  containerName: row.container_name,
  port: row.port,
  version: row.version,
  memoryMb: row.memory_mb,
  cpu: Number(row.cpu),
  maxPlayers: row.max_players,
  volume: row.volume,
  lastError: row.last_error,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listServerRecords() {
  const { rows } = await pool.query(
    'SELECT * FROM minecraft_servers ORDER BY created_at DESC',
  );
  return rows.map(mapRow);
}

export async function getServerRecord(id) {
  const { rows } = await pool.query(
    'SELECT * FROM minecraft_servers WHERE id = $1',
    [id],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function upsertServerRecord(server) {
  const { rows } = await pool.query(
    `
      INSERT INTO minecraft_servers (
        id, name, container_id, container_name, port, version,
        memory_mb, cpu, max_players, volume, status, last_error,
        created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
              COALESCE($13::timestamptz, NOW()), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        container_id = EXCLUDED.container_id,
        container_name = EXCLUDED.container_name,
        port = EXCLUDED.port,
        version = EXCLUDED.version,
        memory_mb = EXCLUDED.memory_mb,
        cpu = EXCLUDED.cpu,
        max_players = EXCLUDED.max_players,
        volume = EXCLUDED.volume,
        status = EXCLUDED.status,
        last_error = EXCLUDED.last_error,
        updated_at = NOW()
      RETURNING *
    `,
    [
      server.id,
      server.name,
      server.containerId ?? null,
      server.containerName ?? null,
      server.port ?? null,
      server.version,
      server.memoryMb,
      server.cpu,
      server.maxPlayers,
      server.volume ?? null,
      server.status,
      server.lastError ?? null,
      server.createdAt ?? null,
    ],
  );
  return mapRow(rows[0]);
}

export async function updateServerStatus(id, status, lastError = null) {
  const { rows } = await pool.query(
    `
      UPDATE minecraft_servers
      SET status = $2, last_error = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id, status, lastError],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteServerRecord(id) {
  await pool.query('DELETE FROM minecraft_servers WHERE id = $1', [id]);
}
