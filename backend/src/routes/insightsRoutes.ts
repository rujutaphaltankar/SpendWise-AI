import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { getInsight } from "../controllers/insightsController";

const router = Router();
router.use(requireAuth);
router.get("/", aiRateLimiter, getInsight);

export default router;
