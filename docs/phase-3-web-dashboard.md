# Phase 3 - React Web Dashboard

Phase 3 adds the self-service web interface for the Minecraft Cloud control plane.

## Scope

The dashboard intentionally covers only the lifecycle operations already exposed by the Phase 2 Express API:

- List managed Minecraft servers.
- Create a new Vanilla Minecraft server.
- Start a stopped server.
- Stop a running server.
- Restart a server.
- Delete a server and its world volume after confirmation.
- Display server status, allocated port, memory, CPU, player limit, and version.
- Display aggregate allocated resources.
- Display Docker connectivity from the backend health endpoint.

Authentication, billing, file management, live console access, and advanced server settings remain outside the MVP scope.

## Frontend Stack

- React
- Vite
- Lucide React icons
- Native Fetch API
- Plain CSS with responsive layouts
- ESLint

No state-management or UI framework is introduced because the current dashboard does not need that complexity.

## Structure

```text
frontend/
โ”โ”€โ”€ src/
โ”   โ”โ”€โ”€ api.js
โ”   โ”โ”€โ”€ App.jsx
โ”   โ”โ”€โ”€ main.jsx
โ”   โ””โ”€โ”€ styles.css
โ”โ”€โ”€ eslint.config.js
โ”โ”€โ”€ index.html
โ”โ”€โ”€ package.json
โ””โ”€โ”€ package-lock.json
```

## API Integration

The frontend defaults to:

```text
http://localhost:8000
```

Override this with:

```text
VITE_API_BASE_URL=http://localhost:8000
```

The Phase 2 backend already permits the Vite development origin `http://localhost:5173` by default.

## Local Development

Start the backend first, then run the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## Verification

Static validation for this phase:

```powershell
npm run check
npm run build
```

Both commands should pass before moving on.

Full end-to-end lifecycle testing additionally requires Docker Desktop / Docker Engine to be running because the backend creates actual Minecraft containers.

## UI Behavior

The dashboard polls the API every 10 seconds so lifecycle state changes remain visible without introducing WebSockets at this stage. Action buttons also update the affected server immediately after an API response.

Creating a server submits:

```json
{
  "name": "survival-world",
  "version": "LATEST",
  "memoryMb": 1024,
  "cpu": 1,
  "maxPlayers": 10
}
```

The backend remains responsible for allocating the Minecraft port, creating the Docker volume, configuring resource limits, and starting the container.

## Phase Boundary

Phase 3 is only the web control surface. Deployment packaging, database-backed metadata, CI/CD, infrastructure provisioning, configuration management, and observability remain separate later phases so the project stays explainable and manageable.



