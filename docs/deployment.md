# Deployment and CI/CD

The project uses GitHub Actions for basic CI/CD.

## CI

On pull requests and pushes to `main`, GitHub Actions checks:

- backend syntax and tests
- frontend lint/build
- Docker Compose configuration
- Prometheus configuration
- Grafana dashboard JSON

## Image Build

After CI passes on `main`, GitHub Actions builds:

```text
minecraft-cloud-backend
minecraft-cloud-frontend
```

The images are pushed to GitHub Container Registry (GHCR) using both `latest` and `sha-<commit>` tags.

## Deployment

An Ubuntu VM runs a GitHub self-hosted runner.

```text
GitHub Actions
      |
      v
     GHCR
      |
      v
Self-hosted Runner
      |
      v
docker compose pull
      |
      v
docker compose up -d
```

The runner pulls the image for the same commit that passed CI and starts the stack with Docker Compose.

The VM needs Docker, Docker Compose v2, and the GitHub Actions runner installed.

Secrets such as PostgreSQL and Grafana passwords are stored in the GitHub `production` environment instead of the repository.

## Useful Commands

```bash
docker compose ps
docker compose logs
docker system df
```

If the VM starts running out of disk space, unused Docker images and build cache can be cleaned up. The deployment workflow also performs basic Docker cleanup before deploying.
