import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { createBudgetSchema, updateBudgetSchema } from "../validators/budgetValidators";
import * as budgetController from "../controllers/budgetController";

const router = Router();
router.use(requireAuth);
router.get("/", budgetController.listBudgets);
router.post("/", validate(createBudgetSchema), budgetController.createBudget);
router.put("/:id", validate(updateBudgetSchema), budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

export default router;
