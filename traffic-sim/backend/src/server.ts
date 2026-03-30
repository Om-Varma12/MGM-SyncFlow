import express from "express";
import cors from "cors";
import { config } from "./config/env";
import simulationRoutes from "./routes/simulationRoutes";
import hospitalRoutes from "./routes/hospitalRoutes";
import dispatchRoutes from "./routes/dispatchRoutes";

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
}));
app.use(express.json());

// Routes
app.use("/api/simulation", simulationRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/dispatch", dispatchRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
});
