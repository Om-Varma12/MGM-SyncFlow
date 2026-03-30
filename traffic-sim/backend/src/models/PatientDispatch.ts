export interface PatientDispatch {
  trackingId: string;
  dispatchedAt: string;
  destinationHospital: string;
  destinationLat: number;
  destinationLng: number;
  patientName: string;
  patientId: string;
  age: number;
  bloodGroup: string;
  condition: "Stable" | "Serious" | "Critical";
  ambulanceId: string;
  requiredDepartment: string;
  notes?: string;
  route: [number, number][];
  estimatedDurationSeconds: number;
  status: "DISPATCHED" | "IN_TRANSIT" | "DELIVERED";
}

export interface PatientDispatchRequest {
  patientName: string;
  patientId: string;
  age: number;
  bloodGroup: string;
  condition: string;
  destinationHospital: string;
  ambulanceId: string;
  requiredDepartment: string;
  notes?: string;
}
