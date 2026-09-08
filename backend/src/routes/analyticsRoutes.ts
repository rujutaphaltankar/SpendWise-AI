import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { validateQuery } from "../middleware/validate";
import { dateRangeQuerySchema, trendsQuerySchema } from "../validators/analyticsValidators";
import * as analyticsController from "../controllers/analyticsController";

const router = Router();

router.use(requireAuth);

router.get("/summary", validateQuery(dateRangeQuerySchema), analyticsController.getSummary);
router.get(
  "/categories",
  validateQuery(dateRangeQuerySchema),
  analyticsController.getCategoryBreakdown
);
router.get("/trends", validateQuery(trendsQuerySchema), analyticsController.getTrends);

export default router;
