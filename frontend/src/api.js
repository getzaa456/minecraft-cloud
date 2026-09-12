const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  health: () => request('/health'),
  listServers: () => request('/api/servers'),
  createServer: (payload) =>
    request('/api/servers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  startServer: (serverId) => request(`/api/servers/${serverId}/start`, { method: 'POST' }),
  stopServer: (serverId) => request(`/api/servers/${serverId}/stop`, { method: 'POST' }),
  restartServer: (serverId) => request(`/api/servers/${serverId}/restart`, { method: 'POST' }),
  deleteServer: (serverId) => request(`/api/servers/${serverId}`, { method: 'DELETE' }),
};
