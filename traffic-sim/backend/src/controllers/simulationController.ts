import type { Request, Response } from "express";
import { runSimulation } from "../services/simulation/simulationEngine";

type LatLng = [number, number];

function isValidLatLng(value: unknown): value is LatLng {
  if (!Array.isArray(value) || value.length !== 2) return false;

  const [lat, lng] = value;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export const startSimulation = async (req: Request, res: Response): Promise<void> => {
  const { source, destination } = req.body;

  if (!source || !destination) {
    res.status(400).json({
      message: "source and destination are required",
      details: "Expected body shape: { source: [lat, lng], destination: [lat, lng] }",
    });
    return;
  }

  if (!isValidLatLng(source) || !isValidLatLng(destination)) {
    res.status(400).json({
      message: "Invalid coordinates",
      details:
        "source and destination must be [lat, lng] arrays with finite numbers in valid latitude/longitude bounds",
    });
    return;
  }

  try {
    const result = await runSimulation(source, destination);
    res.json(result);
  } catch (err) {
    console.error("Simulation error:", err);
    res.status(500).json({ message: "Simulation failed", details: String(err) });
  }
};
