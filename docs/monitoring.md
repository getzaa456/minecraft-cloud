# Monitoring

Minecraft Cloud uses Prometheus and Grafana for simple monitoring.

## Components

- Prometheus - collects metrics
- Grafana - displays dashboards
- Node Exporter - VM CPU and memory metrics
- cAdvisor - Docker container metrics
- Backend `/metrics` - request and latency metrics

## Dashboard

The included Grafana dashboard shows:

- VM CPU usage
- VM memory usage
- container CPU usage
- container memory usage
- backend request rate
- backend 5xx rate
- backend p95 latency
- Prometheus target status

Grafana is available on port `3001` by default:

```text
http://<VM-IP>:3001
```

The admin password is configured with:

```text
GRAFANA_ADMIN_PASSWORD
```

Prometheus and the exporters stay inside the Docker network and do not need public ports.
