import type { LatLng } from "../routing/hybridRouting";
import type { CCTVNode } from "../../models/CCTVNode";

const TURN_THRESHOLD_DEG = 45;
const MIN_SHARP_TURN_SPACING_METERS = 250;
const MAX_CCTV_PER_ROUTE = 10;

interface CCTVGenerationOptions {
  routeIndex?: number;
}

interface SharpTurnCandidate {
  index: number;
  angleDeg: number;
}

function metersBetween(a: LatLng, b: LatLng): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  return Math.hypot(lat1 - lat2, lng1 - lng2) * 111000;
}

function normalizeDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function turnAngleDeg(a: LatLng, b: LatLng, c: LatLng): number {
  const v1x = b[0] - a[0];
  const v1y = b[1] - a[1];
  const v2x = c[0] - b[0];
  const v2y = c[1] - b[1];

  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);

  if (m1 === 0 || m2 === 0) return 0;

  const dot = v1x * v2x + v1y * v2y;
  const cosine = Math.min(1, Math.max(-1, dot / (m1 * m2)));
  return normalizeDeg(Math.acos(cosine));
}

function randomId(): string {
  return `C${String(Math.floor(Math.random() * 900) + 100)}`;
}

function detectSharpTurnCandidates(path: LatLng[]): SharpTurnCandidate[] {
  const candidates: SharpTurnCandidate[] = [];

  for (let i = 1; i < path.length - 1; i++) {
    const angleDeg = turnAngleDeg(path[i - 1], path[i], path[i + 1]);
    if (angleDeg >= TURN_THRESHOLD_DEG) {
      candidates.push({ index: i, angleDeg });
    }
  }

  return candidates;
}

function applyCandidateSpacing(path: LatLng[], candidates: SharpTurnCandidate[]): SharpTurnCandidate[] {
  const selected: SharpTurnCandidate[] = [];

  for (const candidate of candidates) {
    const tooClose = selected.some(
      (existing) =>
        metersBetween(path[existing.index], path[candidate.index]) < MIN_SHARP_TURN_SPACING_METERS
    );

    if (!tooClose) {
      selected.push(candidate);
    }
  }

  return selected;
}

function capCandidates(candidates: SharpTurnCandidate[], maxCount: number): SharpTurnCandidate[] {
  if (candidates.length <= maxCount) return candidates;

  const stride = candidates.length / maxCount;
  const selected: SharpTurnCandidate[] = [];

  for (let i = 0; i < maxCount; i++) {
    selected.push(candidates[Math.floor(i * stride)]);
  }

  return selected;
}

export async function generateCCTVNodes(
  path: LatLng[],
  options: CCTVGenerationOptions = {}
): Promise<CCTVNode[]> {
  if (path.length === 0) return [];

  const routeIndex = options.routeIndex ?? 0;
  const routeId = `route-${routeIndex}`;

  // Fast mode: geometry-only sharp-turn detection with spacing and cap.
  const sharpTurns = capCandidates(
    applyCandidateSpacing(path, detectSharpTurnCandidates(path)),
    MAX_CCTV_PER_ROUTE
  );

  const selectedIndices = new Set<number>([0, path.length - 1]);
  for (const turn of sharpTurns) {
    selectedIndices.add(turn.index);
  }

  const selectedNodes = Array.from(selectedIndices)
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      lat: path[index][0],
      lng: path[index][1],
      turnAngleDeg: sharpTurns.find((turn) => turn.index === index)?.angleDeg,
      intersectionValidated: false,
    }));

  return selectedNodes.map((node) => ({
    id: randomId(),
    lat: node.lat,
    lng: node.lng,
    status: "IDLE",
    lastUpdate: new Date(),
    assignedRouteId: routeId,
    routeIndex,
    pathIndex: node.index,
    turnAngleDeg: node.turnAngleDeg,
    intersectionValidated: node.intersectionValidated,
  }));
}
