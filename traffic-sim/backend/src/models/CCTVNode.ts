export type CCTVStatus = "IDLE" | "TRACKING" | "VIOLATION" | "OFFLINE";

export interface CCTVNode {
  id: string;
  lat: number;
  lng: number;
  status: CCTVStatus;
  lastUpdate?: Date;
  assignedRouteId?: string;
  routeIndex?: number;
  pathIndex?: number;
  turnAngleDeg?: number;
  intersectionValidated?: boolean;
}

export interface ViolationEvent {
  type: "VIOLATION";
  plate: string;
  timestamp: Date;
  cctvId: string;
  lat: number;
  lng: number;
}
