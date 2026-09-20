# Phase 7 - Prometheus and Grafana Monitoring

Phase 7 adds infrastructure, container, and backend observability to Minecraft Cloud without introducing a separate logging stack.

## Components

- **Prometheus** - scrapes and stores metrics with 7-day retention.
- **Grafana** - visualizes the provisioned Minecraft Cloud dashboard.
- **Node Exporter** - exposes Linux host CPU, memory, filesystem, and system metrics.
- **cAdvisor** - exposes Docker container CPU and memory metrics.
- **Backend /metrics** - exposes Node.js process metrics plus HTTP request counters and latency histograms.

## Metrics Flow

```text
Node Exporter -----+
cAdvisor ----------+--> Prometheus --> Grafana
Backend /metrics --+
```

Prometheus and exporters are only attached to the internal Compose network. Grafana is exposed on host port `3001` by default.

## Dashboard

Grafana automatically provisions the **Minecraft Cloud Overview** dashboard with:

- scrape targets up
- host CPU usage
- host memory usage
- backend request rate grouped by HTTP status
- backend p95 latency
- backend 5xx rate
- per-container CPU usage
- per-container memory usage

Dashboard definition:

```text
monitoring/grafana/dashboards/minecraft-cloud-overview.json
```

## Backend Metrics

The backend exposes:

```text
GET /metrics
```

Prometheus scrapes this endpoint over the internal Compose network. It is not routed publicly through Caddy.

Application metrics include:

```text
minecraft_cloud_http_requests_total
minecraft_cloud_http_request_duration_seconds
```

The backend also exports default Node.js process/runtime metrics with the `minecraft_cloud_` prefix.

## Configuration

Local defaults are defined in `.env.example`:

```text
GRAFANA_PORT=3001
GRAFANA_ADMIN_PASSWORD=change-me
```

For production, configure the GitHub Environment `production` with the secret:

```text
GRAFANA_ADMIN_PASSWORD
```

The release workflow writes that secret into the runtime `.env` on the self-hosted runner before deployment.

## Start Locally

From the repository root:

```powershell
docker compose up -d --build
```

Open:

```text
Application: http://localhost
Grafana:     http://localhost:3001
```

Grafana login:

```text
username: admin
password: value of GRAFANA_ADMIN_PASSWORD
```

## Verification

Check all services:

```powershell
docker compose ps
```

Check Prometheus targets from inside the Compose network:

```powershell
docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets
```

Check backend metrics:

```powershell
docker compose exec prometheus wget -qO- http://backend:8000/metrics
```

## CI/CD

CI validates:

- backend metrics code through the normal backend syntax checks
- Docker Compose configuration
- Prometheus configuration with `promtool`
- Grafana dashboard JSON

Production deployment pulls the monitoring images before running:

```text
docker compose up -d --no-build --pull never
```

Monitoring data persists in the named volumes:

```text
prometheus_data
grafana_data
```

Phase 8 can focus on final security hardening and documentation instead of adding more observability scope.
