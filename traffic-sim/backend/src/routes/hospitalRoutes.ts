import express from "express";
import type { Hospital } from "../models/Hospital";

const router = express.Router();

// Hospital data served to frontend
export const hospitals: Hospital[] = [
  {
    id: "H1",
    name: "Government Medical College & Hospital",
    lat: 19.8762,
    lng: 75.3433,
    address: "Maharashtra, India",
  },
  {
    id: "H2",
    name: "Kamalnayan Bajaj Hospital",
    lat: 19.8553,
    lng: 75.329,
    address: "Maharashtra, India",
  },
  {
    id: "H3",
    name: "United CIIGMA Hospital",
    lat: 19.8768,
    lng: 75.3305,
    address: "Maharashtra, India",
  },
  {
    id: "H4",
    name: "Soni Hospital",
    lat: 19.8777,
    lng: 75.3473,
    address: "Maheshnagar Road, Aurangabad, Maharashtra",
  },
  {
    id: "H5",
    name: "M.G.M. Hospital",
    lat: 19.8779,
    lng: 75.3542,
    address: "Aurangabad, Maharashtra",
  },
  {
    id: "H6",
    name: "Dr. Hedgewar Rugnalya",
    lat: 19.8691,
    lng: 75.3482,
    address: "Aurangabad, Maharashtra",
  },
  {
    id: "H7",
    name: "AIMS Hospital",
    lat: 19.9049,
    lng: 75.3565,
    address: "Aurangabad, Maharashtra",
  },
];

router.get("/", (_req, res) => {
  res.json(hospitals);
});

router.get("/:id", (req, res) => {
  const hospital = hospitals.find((h) => h.id === req.params.id);
  if (!hospital) {
    res.status(404).json({ error: "Hospital not found" });
    return;
  }
  res.json(hospital);
});

export default router;
