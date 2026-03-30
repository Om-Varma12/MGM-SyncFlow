import { config } from "../../config/env";
import { aStarGraph } from "./aStarGraph";
import { fetchRoadGraph, findClosestNode } from "./roadGraph";
import { fetchTruckRoutes, type LatLng, type RouteOption } from "./orsRouting";

export { type LatLng, type RouteOption };

// Fetch routes from OSRM (multiple alternatives)
interface OSRMResponse {
  routes: Array<{
    geometry: { coordinates: number[][] };
    distance: number;
    duration: number;
  }>;
}

export async function fetchRoutes(
  start: LatLng,
  end: LatLng
): Promise<RouteOption[]> {
  const url = `${config.osrmUrl}/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=simplified&geometries=geojson&alternatives=true`;

  const res = await fetch(url);
  const data = await res.json() as { routes: OSRMResponse["routes"] };

  if (!data.routes || data.routes.length === 0) {
    throw new Error(`OSRM returned no routes for ${start} -> ${end}`);
  }

  return data.routes.map((r, idx) => ({
    index: idx,
    path: r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng),
    distance: r.distance,
    duration: r.duration,
  }));
}

// Score a route (lower is better)
export function scoreRoute(route: RouteOption): number {
  let cost = 0;

  // base cost = distance
  cost += route.distance;

  // Penalize too many turns (non-highway behavior)
  let turns = 0;

  for (let i = 2; i < route.path.length; i++) {
    const [lat1, lng1] = route.path[i - 2];
    const [lat2, lng2] = route.path[i - 1];
    const [lat3, lng3] = route.path[i];

    const angle =
      Math.abs(
        Math.atan2(lat3 - lat2, lng3 - lng2) -
        Math.atan2(lat2 - lat1, lng2 - lng1)
      );

    if (angle > 0.5) turns++;
  }

  // more turns → worse route (alleys, local roads)
  cost += turns * 50;

  return cost;
}

// Hybrid routing using A* on OpenStreetMap data
export async function hybridRoute(
  start: LatLng,
  end: LatLng
): Promise<{ path: LatLng[]; distance: number }> {
  // Get road graph near start point
  const graph = await fetchRoadGraph(start[0], start[1]);

  // Find closest nodes to start and end
  const startNodeId = findClosestNode(start[0], start[1], graph);
  const endNodeId = findClosestNode(end[0], end[1], graph);

  // Run A* from start to end
  const path = aStarGraph(graph, startNodeId, endNodeId);

  // Calculate approximate distance
  let distance = 0;
  for (let i = 1; i < path.length; i++) {
    distance += Math.hypot(
      path[i][0] - path[i - 1][0],
      path[i][1] - path[i - 1][1]
    ) * 111000; // rough meters per degree
  }

  return { path, distance };
}
