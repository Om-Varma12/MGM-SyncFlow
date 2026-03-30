# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a traffic simulation system with ambulance routing. It has two main components:
- **Frontend**: React + Vite + TypeScript, renders a map with hospitals, routes, and ambulance animation
- **Backend**: Express + TypeScript, handles routing calculations, CCTV node generation, and violation detection

## Development Commands

### Frontend (in `frontend/` directory)
```bash
npm install
npm run dev      # Start dev server on http://localhost:5173
npm run build    # Production build
npm run lint     # ESLint check
```

### Backend (in `backend/` directory)
```bash
npm install
npm run dev      # Start dev server on http://localhost:5000 (uses ts-node)
npm run build    # Compile TypeScript to dist/
npm start        # Run production build from dist/
```

### Both concurrently
Run frontend (`npm run dev` in `frontend/`) and backend (`npm run dev` in `backend/`) simultaneously for full functionality.

## Architecture

### Frontend (`frontend/src/`)
- `App.tsx` - Main component, fetches hospitals, runs simulation, manages animation state
- `services/api.ts` - API client for backend communication (`http://localhost:5000/api`)
- `components/MapView.jsx` - Leaflet map rendering hospitals, routes, and ambulance marker
- `components/ControlPanel.jsx` - Simulation trigger UI
- `components/LogsPanel.jsx` - Event log display

### Backend (`backend/src/`)
- `server.ts` - Express app setup, CORS config, route mounting
- `routes/simulationRoutes.ts` - POST `/api/simulation/start`
- `routes/hospitalRoutes.ts` - GET `/api/hospitals` (static hospital data for Aurangabad, Maharashtra)
- `controllers/simulationController.ts` - Orchestrates simulation flow
- `services/simulation/simulationEngine.ts` - Core simulation logic (route selection, CCTV generation)
- `services/routing/hybridRouting.ts` - Route fetching via OSRM (`https://router.project-osrm.org`) and A* on OpenStreetMap data via Overpass API
- `services/routing/roadGraph.ts` - Fetches road network from Overpass API, builds graph structure
- `services/routing/aStarGraph.ts` - A* pathfinding on OSM graph
- `services/cctv/cctvService.ts` - Generates CCTV nodes along a route
- `services/cctv/violationService.ts` - Random violation event generation (20% chance per check)
- `models/` - TypeScript interfaces: `CCTVNode`, `EventLog`, `Hospital`

### API Contract
- `POST /api/simulation/start` - Body: `{ source: [lat, lng], destination: [lat, lng] }` → `{ route, cctvs, logs, waypoints, violations }`
- `GET /api/hospitals` → Array of hospitals in Aurangabad, Maharashtra area

### External Services
- **OSRM** (`https://router.project-osrm.org`) - Route geometry and alternatives
- **Overpass API** (`https://overpass.kumi.systems/api/interpreter`) - OpenStreetMap road network data
- **ORS API Key** - Set in `backend/.env` as `ORS_API_KEY` (optional, for advanced routing)

## Known Issues

The file `frontend/thingsToImplement.md` contains a detailed bug analysis of 23 flaws in the current implementation, including:
- Cars ignore traffic signals and lack collision detection
- No smooth lerped motion or acceleration/deceleration
- Unsafe material type casting and z-fighting risk
- No object pooling or LOD for 80+ car components
- OrbitControls damping not configured

These are documented implementation issues to be aware of when modifying the simulation.
