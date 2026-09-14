# Phase 6 - CI/CD with GitHub Actions, GHCR, and Self-Hosted Deployment

Phase 6 provides the complete delivery path for Minecraft Cloud: validate the code, build container images, publish them to GHCR, and deploy the exact successful commit to the production VM through a GitHub self-hosted runner.

## Goals

- Validate backend code on pull requests and pushes to `main`.
- Validate frontend linting and production builds.
- Validate the Docker Compose configuration.
- Build backend and frontend container images automatically.
- Publish immutable commit-specific images to GitHub Container Registry (GHCR).
- Deploy successful `main` builds to the production VM with a self-hosted GitHub Actions runner.

## CI Workflow

`.github/workflows/ci.yml` runs three independent jobs:

1. **Backend checks**
   - `npm ci`
   - syntax checks
   - Node.js tests
   - high-severity dependency audit

2. **Frontend checks**
   - `npm ci`
   - ESLint
   - Vite production build
   - high-severity dependency audit

3. **Compose validation**
   - create a temporary `.env` from `.env.example`
   - run `docker compose config --quiet`

## Release and Deployment Workflow

`.github/workflows/release.yml` starts after CI succeeds on `main`. It can also be started manually from `main`.

### Build and Publish

GitHub-hosted runners build and push:

```text
ghcr.io/<github-owner>/minecraft-cloud-backend
ghcr.io/<github-owner>/minecraft-cloud-frontend
```

Each image receives:

- `latest`
- `sha-<commit>`

The deployment uses the `sha-<commit>` tag so production is tied to the exact commit that passed CI.

### Deploy

The deploy job runs on:

```text
[self-hosted, linux, x64]
```

The runner is installed directly on the production Ubuntu VM. It:

1. checks out the successful commit;
2. logs in to GHCR with `GITHUB_TOKEN`;
3. generates `.env` from `.env.example`;
4. injects deployment secrets and image tags;
5. pulls the release images;
6. runs `docker compose up -d --no-build --remove-orphans`;
7. prints the final Compose status.

## Pipeline Flow

```text
Pull Request / Push
        |
        v
+---------------------+
|   GitHub Actions CI |
+---------------------+
   |       |       |
   v       v       v
Backend  Frontend  Compose
Checks   Checks    Validate
   \       |       /
    \      |      /
       successful
           |
           v
        main
           |
           v
+----------------------+
| Build Docker Images  |
+----------------------+
           |
           v
          GHCR
           |
           v
+----------------------+
| Self-Hosted Runner   |
| Production Ubuntu VM |
+----------------------+
           |
           v
 docker compose pull
 docker compose up -d
```

## Production Runner Requirements

The Ubuntu VM must already have:

- Docker Engine;
- Docker Compose v2;
- a GitHub self-hosted runner registered to the repository;
- runner user permission to execute Docker commands;
- outbound access to GitHub and GHCR.

The workflow does not install or configure the runner automatically.

## GitHub Environment

Create a GitHub Environment named:

```text
production
```

Add this environment secret:

```text
POSTGRES_PASSWORD
```

Optionally add this environment variable when the dashboard is accessed through a VM IP or domain:

```text
CORS_ORIGIN=http://<vm-ip-or-domain>
```

No `.env` file is committed to Git.

## Docker Compose Image Selection

The root `docker-compose.yml` supports both local development and production deployment.

For local development:

```powershell
docker compose up -d --build
```

This builds the backend and frontend locally.

For production, the workflow writes these values into `.env`:

```text
BACKEND_IMAGE=ghcr.io/<owner>/minecraft-cloud-backend:sha-<commit>
FRONTEND_IMAGE=ghcr.io/<owner>/minecraft-cloud-frontend:sha-<commit>
```

Then the self-hosted runner uses:

```bash
docker compose pull
docker compose up -d --no-build --remove-orphans
```

## Security Notes

- CI only requests repository read access.
- Release requires `packages: write` for GHCR publishing.
- Deployment secrets are stored in the `production` GitHub Environment.
- Production deploys immutable `sha-*` image tags rather than relying on `latest`.
- The production job uses a dedicated self-hosted runner and does not require SSH from GitHub-hosted infrastructure.

## Verification

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose config --quiet
```

On the production VM, verify the runner user can run:

```bash
docker version
docker compose version
```

After a successful push to `main`, inspect the repository **Actions** tab. The expected sequence is:

```text
CI -> Publish Images -> Deploy to production
```
