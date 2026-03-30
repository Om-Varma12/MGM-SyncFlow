import express from "express";
import { dispatchOrgan, dispatchPatient } from "../controllers/dispatchController";

const router = express.Router();

router.post("/organ", dispatchOrgan);
router.post("/patient", dispatchPatient);

export default router;
