import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { createSavingsGoalSchema, updateSavingsGoalSchema } from "../validators/savingsGoalValidators";
import * as savingsGoalController from "../controllers/savingsGoalController";

const router = Router();
router.use(requireAuth);
router.get("/", savingsGoalController.listGoals);
router.post("/", validate(createSavingsGoalSchema), savingsGoalController.createGoal);
router.put("/:id", validate(updateSavingsGoalSchema), savingsGoalController.updateGoal);
router.delete("/:id", savingsGoalController.deleteGoal);

export default router;
