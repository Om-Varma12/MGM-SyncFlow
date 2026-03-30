export interface OrganDispatch {
  trackingId: string;
  dispatchedAt: string;
  destinationHospital: string;
  destinationLat: number;
  destinationLng: number;
  organType: string;
  bloodGroup: string;
  donorId: string;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  notes?: string;
  route: [number, number][];
  estimatedDurationSeconds: number;
  status: "DISPATCHED" | "IN_TRANSIT" | "DELIVERED";
}

export interface OrganDispatchRequest {
  organType: string;
  bloodGroup: string;
  donorId: string;
  destinationHospital: string;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  notes?: string;
}
