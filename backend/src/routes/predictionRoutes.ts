import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as predictionController from "../controllers/predictionController";

const router = Router();
router.use(requireAuth);
router.get("/monthly", predictionController.getMonthlyPrediction);
router.get("/categories", predictionController.getCategoryForecasts);
router.get("/anomalies", predictionController.getAnomalies);

export default router;
