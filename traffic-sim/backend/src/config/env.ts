import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  orsApiKey: process.env.ORS_API_KEY || "YOUR_OPENROUTESERVICE_API_KEY",
  overpassUrl: process.env.OVERPASS_URL || "https://overpass.openstreetmap.ru/api/interpreter",
  osrmUrl: process.env.OSRM_URL || "https://router.project-osrm.org",
};
