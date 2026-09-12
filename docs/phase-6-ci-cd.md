# Phase 6 - CI/CD with GitHub Actions and GHCR

Phase 6 adds automated quality checks and container image delivery for Minecraft Cloud.

## Goals

- Validate backend code on every pull request and push to `main`.
- Validate frontend linting and production builds.
- Validate the Docker Compose configuration.
- Build backend and frontend container images automatically.
- Publish versioned images to GitHub Container Registry (GHCR).
- Keep host configuration and deployment separate until Ansible is introduced in Phase 7.

## Workflows

### CI - `.github/workflows/ci.yml`

The CI workflow runs on pull requests and pushes to `main`.

It contains three independent jobs:

1. **Backend checks**
   - Install dependencies with `npm ci`.
   - Run backend syntax checks.
   - Run Node.js tests.
   - Fail on high-severity dependency audit findings.

2. **Frontend checks**
   - Install dependencies with `npm ci`.
   - Run ESLint.
   - Produce a Vite production build.
   - Fail on high-severity dependency audit findings.

3. **Compose validation**
   - Create a temporary `.env` from `.env.example`.
   - Validate `deploy/compose/platform.compose.yml` with Docker Compose.

The jobs run independently so failures can be identified quickly.

## Container Delivery - `.github/workflows/release.yml`

The release workflow runs after the `CI` workflow completes successfully on `main`, and can also be started manually with `workflow_dispatch`. This prevents publishing images from commits that fail the quality gates.

It uses Docker Buildx and publishes two images:

```text
ghcr.io/<github-owner>/minecraft-cloud-backend
ghcr.io/<github-owner>/minecraft-cloud-frontend
```

Each image receives:

- `latest` - the newest successful image from `main`.
- `sha-<commit>` - an immutable commit-specific tag for traceability and rollback.

GitHub Actions authenticates to GHCR with the repository-provided `GITHUB_TOKEN`, so no registry password needs to be committed or added as a custom secret.

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
      push to main
           |
           v
+----------------------+
| Build Docker Images  |
+----------------------+
       |          |
       v          v
    Backend    Frontend
       |          |
       +----+-----+
            |
            v
           GHCR
```

## Security and Permissions

The CI workflow only requests read access to repository contents.

The release workflow requests:

```text
contents: read
packages: write
```

This is enough to check out the repository and publish images to GHCR without granting unnecessary repository permissions.

No `.env` file or application secret is committed to Git.

## Why Deployment Is Not Automated Yet

Phase 6 implements continuous delivery of deployable container images, but does not SSH into a server or deploy to a manually configured host.

The target host configuration is intentionally introduced later:

- Phase 7: Ansible configures the host and deployment environment.

After those phases, the delivery pipeline can consume the same GHCR images for automated deployment without redesigning the build pipeline.

## Verification

The same core checks can be run locally before pushing:

```powershell
cd backend
npm ci
npm run check
npm test
npm audit --audit-level=high
```

```powershell
cd frontend
npm ci
npm run check
npm run build
npm audit --audit-level=high
```

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose --env-file .env -f deploy/compose/platform.compose.yml config --quiet
```

Once pushed to GitHub, open the repository **Actions** tab to inspect CI and release runs. Successful release runs publish the backend and frontend images under the repository owner's GitHub Packages / GHCR packages.
