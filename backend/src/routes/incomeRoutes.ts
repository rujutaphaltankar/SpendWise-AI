import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { validate, validateQuery } from "../middleware/validate";
import {
  createIncomeSchema,
  updateIncomeSchema,
  listIncomeQuerySchema,
} from "../validators/incomeValidators";
import * as incomeController from "../controllers/incomeController";

const router = Router();

router.use(requireAuth);

router.get("/summary", incomeController.getFinancialSummary);
router.get("/", validateQuery(listIncomeQuerySchema), incomeController.listIncome);
router.post("/", validate(createIncomeSchema), incomeController.createIncome);
router.put("/:id", validate(updateIncomeSchema), incomeController.updateIncome);
router.delete("/:id", incomeController.deleteIncome);

export default router;
