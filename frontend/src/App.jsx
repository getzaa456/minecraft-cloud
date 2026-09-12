import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Box,
  CircleStop,
  Cloud,
  Cpu,
  HardDrive,
  MemoryStick,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Server,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { api } from './api.js';

const defaultForm = {
  name: '',
  version: 'LATEST',
  memoryMb: 1024,
  cpu: 1,
  maxPlayers: 10,
};

function StatusBadge({ status }) {
  const normalized = status || 'unknown';
  return (
    <span className={`status status--${normalized}`}>
      <span className="status__dot" />
      {normalized}
    </span>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric">
      <div className="metric__icon"><Icon size={16} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ServerCard({ server, busyAction, onAction }) {
  const isRunning = server.status === 'running';
  const isBusy = Boolean(busyAction);

  return (
    <article className="server-card">
      <div className="server-card__top">
        <div className="server-card__identity">
          <div className="server-icon"><Box size={21} /></div>
          <div>
            <div className="server-card__title-row">
              <h3>{server.name}</h3>
              <StatusBadge status={server.status} />
            </div>
            <p>{server.version || 'LATEST'} · {server.containerName || 'Minecraft server'}</p>
          </div>
        </div>
        <button
          className="icon-button icon-button--danger"
          title="Delete server"
          disabled={isBusy}
          onClick={() => onAction(server, 'delete')}
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="server-address">
        <div>
          <span>SERVER ADDRESS</span>
          <strong>{server.port ? `localhost:${server.port}` : 'Waiting for port'}</strong>
        </div>
        <code>{server.id?.slice(0, 8)}</code>
      </div>

      <div className="metrics-grid">
        <Metric icon={MemoryStick} label="Memory" value={`${server.memoryMb || 0} MB`} />
        <Metric icon={Cpu} label="CPU" value={`${server.cpu || 0} core`} />
        <Metric icon={Users} label="Players" value={`${server.maxPlayers || 0} max`} />
      </div>

      <div className="server-card__actions">
        {isRunning ? (
          <button className="button button--secondary" disabled={isBusy} onClick={() => onAction(server, 'stop')}>
            <CircleStop size={16} /> {busyAction === 'stop' ? 'Stopping…' : 'Stop'}
          </button>
        ) : (
          <button className="button button--primary" disabled={isBusy} onClick={() => onAction(server, 'start')}>
            <Play size={16} /> {busyAction === 'start' ? 'Starting…' : 'Start'}
          </button>
        )}
        <button className="button button--ghost" disabled={isBusy} onClick={() => onAction(server, 'restart')}>
          <RotateCcw size={16} /> {busyAction === 'restart' ? 'Restarting…' : 'Restart'}
        </button>
      </div>
    </article>
  );
}

function CreateServerModal({ onClose, onCreate, creating }) {
  const [form, setForm] = useState(defaultForm);

  const updateField = (event) => {
    const { name, value, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    onCreate(form);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-server-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <div>
            <span className="eyebrow">NEW INSTANCE</span>
            <h2 id="create-server-title">Create Minecraft server</h2>
            <p>Configure a lightweight Vanilla server. You can manage its lifecycle from this dashboard.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field field--wide">
              <span>Server name</span>
              <input name="name" value={form.name} onChange={updateField} placeholder="survival-world" maxLength={40} required autoFocus />
            </label>

            <label className="field">
              <span>Minecraft version</span>
              <input name="version" value={form.version} onChange={updateField} placeholder="LATEST" />
            </label>

            <label className="field">
              <span>Max players</span>
              <input name="maxPlayers" type="number" min="1" max="100" value={form.maxPlayers} onChange={updateField} />
            </label>

            <label className="field">
              <span>Memory</span>
              <select name="memoryMb" value={form.memoryMb} onChange={updateField}>
                <option value={512}>512 MB</option>
                <option value={1024}>1 GB</option>
                <option value={2048}>2 GB</option>
                <option value={4096}>4 GB</option>
              </select>
            </label>

            <label className="field">
              <span>CPU</span>
              <select name="cpu" value={form.cpu} onChange={updateField}>
                <option value={0.5}>0.5 core</option>
                <option value={1}>1 core</option>
                <option value={1.5}>1.5 cores</option>
                <option value={2}>2 cores</option>
              </select>
            </label>
          </div>

          <div className="modal__note">
            <HardDrive size={17} />
            A dedicated Docker volume is created automatically for this server's world data.
          </div>

          <div className="modal__actions">
            <button type="button" className="button button--ghost" onClick={onClose} disabled={creating}>Cancel</button>
            <button type="submit" className="button button--primary" disabled={creating}>
              <Plus size={16} /> {creating ? 'Creating server…' : 'Create server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState('checking');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState({});

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [healthResult, serversResult] = await Promise.all([api.health(), api.listServers()]);
      setHealth(healthResult.docker === 'reachable' ? 'online' : 'offline');
      setServers(serversResult.servers ?? []);
    } catch (requestError) {
      setHealth('offline');
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadData, 0);
    const interval = window.setInterval(loadData, 10000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadData]);

  const stats = useMemo(() => {
    const running = servers.filter((server) => server.status === 'running').length;
    const totalMemory = servers.reduce((sum, server) => sum + (server.memoryMb || 0), 0);
    const totalCpu = servers.reduce((sum, server) => sum + (server.cpu || 0), 0);
    return { running, total: servers.length, totalMemory, totalCpu };
  }, [servers]);

  const createServer = async (payload) => {
    setCreating(true);
    setError('');
    try {
      const result = await api.createServer(payload);
      setServers((current) => [result.server, ...current.filter((item) => item.id !== result.server.id)]);
      setModalOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (server, action) => {
    if (action === 'delete' && !window.confirm(`Delete “${server.name}” and its world volume? This cannot be undone.`)) return;

    setBusy((current) => ({ ...current, [server.id]: action }));
    setError('');
    try {
      const method = {
        start: api.startServer,
        stop: api.stopServer,
        restart: api.restartServer,
        delete: api.deleteServer,
      }[action];
      const result = await method(server.id);

      if (action === 'delete') {
        setServers((current) => current.filter((item) => item.id !== server.id));
      } else {
        setServers((current) => current.map((item) => (item.id === server.id ? result.server : item)));
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy((current) => {
        const next = { ...current };
        delete next[server.id];
        return next;
      });
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark"><Cloud size={22} /></div>
          <div><strong>Minecraft Cloud</strong><span>Control plane</span></div>
        </div>
        <nav>
          <a className="nav-item nav-item--active" href="#servers"><Server size={18} /> Servers</a>
          <a className="nav-item" href="#overview"><Activity size={18} /> Overview</a>
        </nav>
        <div className="sidebar__footer">
          <span className={`connection connection--${health}`}><i /> Docker {health}</span>
          <small>Student DevOps Platform</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">INFRASTRUCTURE DASHBOARD</span>
            <h1>Your Minecraft servers</h1>
            <p>Create and control isolated Minecraft workloads from one place.</p>
          </div>
          <div className="topbar__actions">
            <button className="icon-button" title="Refresh" onClick={loadData}><RefreshCw size={18} /></button>
            <button className="button button--primary" onClick={() => setModalOpen(true)}><Plus size={17} /> New server</button>
          </div>
        </header>

        {error && <div className="alert"><strong>Backend error</strong><span>{error}</span></div>}

        <section className="summary-grid" id="overview">
          <div className="summary-card"><span>Running servers</span><strong>{stats.running}<em> / {stats.total}</em></strong><div className="summary-card__icon"><Activity size={19} /></div></div>
          <div className="summary-card"><span>Allocated memory</span><strong>{stats.totalMemory >= 1024 ? `${(stats.totalMemory / 1024).toFixed(1)} GB` : `${stats.totalMemory} MB`}</strong><div className="summary-card__icon"><MemoryStick size={19} /></div></div>
          <div className="summary-card"><span>Allocated CPU</span><strong>{stats.totalCpu.toFixed(stats.totalCpu % 1 ? 1 : 0)} <em>cores</em></strong><div className="summary-card__icon"><Cpu size={19} /></div></div>
        </section>

        <section className="servers-section" id="servers">
          <div className="section-heading">
            <div><h2>Server instances</h2><p>Each instance runs in its own Docker container with persistent world storage.</p></div>
            <span>{servers.length} total</span>
          </div>

          {loading ? (
            <div className="state-card"><RefreshCw className="spin" size={24} /><h3>Loading servers</h3><p>Checking the Minecraft control plane…</p></div>
          ) : servers.length === 0 ? (
            <div className="state-card state-card--empty">
              <div className="state-card__icon"><Server size={28} /></div>
              <h3>No servers yet</h3>
              <p>Create your first Minecraft server. The backend will provision its container, volume, port and resource limits automatically.</p>
              <button className="button button--primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Create first server</button>
            </div>
          ) : (
            <div className="server-grid">
              {servers.map((server) => (
                <ServerCard key={server.id} server={server} busyAction={busy[server.id]} onAction={handleAction} />
              ))}
            </div>
          )}
        </section>
      </main>

      {modalOpen && (
        <CreateServerModal onClose={() => !creating && setModalOpen(false)} onCreate={createServer} creating={creating} />
      )}
    </div>
  );
}
