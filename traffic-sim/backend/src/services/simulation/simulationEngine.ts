import type { LatLng, RouteOption } from "../routing/hybridRouting";
import { fetchRoutes, scoreRoute } from "../routing/hybridRouting";
import { generateCCTVNodes } from "../cctv/cctvService";
import type { EventLog } from "../../models/EventLog";
import type { CCTVNode } from "../../models/CCTVNode";

interface WaypointNode {
  index: number;
  cctvId: string;
  coordinates: LatLng;
}

interface SimulationWaypoints {
  source: WaypointNode;
  intermediate: WaypointNode[];
  destination: WaypointNode;
}

export interface RouteWithCCTVs {
  index: number;
  path: LatLng[];
  distance: number;
  duration: number;
  score: number;
  isBest: boolean;
  cctvs: CCTVNode[];
}

export interface SimulationResult {
  route: LatLng[];
  cctvs: CCTVNode[];
  logs: EventLog[];
  waypoints: SimulationWaypoints | null;
  routes: RouteWithCCTVs[];
  bestRouteIndex: number;
  violations: Array<{
    type: "VIOLATION";
    plate: string;
    timestamp: Date;
    cctvId: string;
    lat: number;
    lng: number;
  }>;
}

export async function runSimulation(
  source: LatLng,
  destination: LatLng
): Promise<SimulationResult> {
  const logs: EventLog[] = [];
  const startedAt = Date.now();

  logs.push({
    id: `log-${Date.now()}-1`,
    timestamp: new Date(),
    event: "SIMULATION_START",
    message: "🚨 Request received",
  });

  // 1. Fetch routes
  const fetchStartedAt = Date.now();
  const routes = await fetchRoutes(source, destination);
  const fetchDurationMs = Date.now() - fetchStartedAt;

  logs.push({
    id: `log-${Date.now()}-2`,
    timestamp: new Date(),
    event: "ROUTE_SELECTED",
    message: `📡 Fetched ${routes.length} route alternatives`,
    data: { routeCount: routes.length, fetchDurationMs },
  });

  // 2. Pick best route
  const scoredRoutes = routes.map((route, idx) => ({
    route: { ...route, index: idx } as RouteOption,
    score: scoreRoute({ ...route, index: idx } as RouteOption),
  }));

  let bestIndex = 0;
  for (let i = 1; i < scoredRoutes.length; i++) {
    if (scoredRoutes[i].score < scoredRoutes[bestIndex].score) {
      bestIndex = i;
    }
  }

  const best = scoredRoutes[bestIndex].route;
  const bestScore = scoredRoutes[bestIndex].score;

  logs.push({
    id: `log-${Date.now()}-3`,
    timestamp: new Date(),
    event: "ROUTE_SELECTED",
    message: "🧭 Best route selected",
    data: { distance: best.distance, duration: best.duration, score: bestScore },
  });

  // 3. Generate CCTV nodes for all route alternatives
  const cctvStartedAt = Date.now();
  const routesWithCCTVs: RouteWithCCTVs[] = await Promise.all(
    scoredRoutes.map(async ({ route, score }) => {
      const cctvs = await generateCCTVNodes(route.path, {
        routeIndex: route.index,
      });

      return {
        index: route.index,
        path: route.path,
        distance: route.distance,
        duration: route.duration,
        score,
        isBest: route.index === best.index,
        cctvs,
      };
    })
  );

  const bestRouteDetails =
    routesWithCCTVs.find((routeOption) => routeOption.index === best.index) ?? routesWithCCTVs[0];
  const cctvs = bestRouteDetails?.cctvs ?? [];
  const cctvDurationMs = Date.now() - cctvStartedAt;

  // Map only the CCTV nodes that exist (cctvs.length may be < best.path.length)
  // source=cctvs[0], destination=cctvs[last], intermediates=cctvs[1..length-2]
  const waypoints: SimulationWaypoints | null =
    best.path.length > 1 && cctvs.length >= 2
      ? {
          source: {
            index: cctvs[0].pathIndex ?? 0,
            cctvId: cctvs[0].id,
            coordinates: [cctvs[0].lat, cctvs[0].lng],
          },
          intermediate:
            cctvs.length > 2
              ? cctvs.slice(1, -1).map((cctv, idx) => ({
                  index: cctv.pathIndex ?? idx + 1,
                  cctvId: cctv.id,
                  coordinates: [cctv.lat, cctv.lng],
                }))
              : [],
          destination: {
            index: cctvs[cctvs.length - 1].pathIndex ?? best.path.length - 1,
            cctvId: cctvs[cctvs.length - 1].id,
            coordinates: [cctvs[cctvs.length - 1].lat, cctvs[cctvs.length - 1].lng],
          },
        }
      : null;

  logs.push({
    id: `log-${Date.now()}-4`,
    timestamp: new Date(),
    event: "CCTV_ACTIVATED",
    message: "📡 CCTV nodes activated",
    data: {
      bestRouteCctvCount: cctvs.length,
      totalRouteCount: routesWithCCTVs.length,
      totalCctvCount: routesWithCCTVs.reduce((acc, routeOption) => acc + routeOption.cctvs.length, 0),
      cctvDurationMs,
    },
  });

  logs.push({
    id: `log-${Date.now()}-5`,
    timestamp: new Date(),
    event: "SIMULATION_END",
    message: "✅ Simulation complete",
    data: {
      totalDurationMs: Date.now() - startedAt,
    },
  });

  return {
    route: best.path,
    cctvs,
    logs,
    waypoints,
    routes: routesWithCCTVs,
    bestRouteIndex: best.index,
    violations: [],
  };
}
