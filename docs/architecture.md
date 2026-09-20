# Architecture

Minecraft Cloud runs on a single Linux VM with Docker Compose.

## Main Components

```text
User
 |
 v
Caddy
 |----------------|
 v                v
Frontend       Backend
                  |
            +-----+------+
            |            |
            v            v
       PostgreSQL     Docker
                       |
                       v
               Minecraft Servers
```

The frontend sends requests to the Node.js backend. The backend stores server information in PostgreSQL and uses Docker to create and manage Minecraft containers.

Minecraft world data is stored in Docker volumes so it can survive container restarts.

The backend does not connect directly to the Docker socket. It uses Docker Socket Proxy as a small extra safety layer.

## Monitoring

```text
Node Exporter -----+
cAdvisor ----------+--> Prometheus --> Grafana
Backend /metrics --+
```

Node Exporter collects VM metrics, cAdvisor collects container metrics, and the backend exposes basic HTTP metrics.
