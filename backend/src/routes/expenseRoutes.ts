import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { validate, validateQuery } from "../middleware/validate";
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
} from "../validators/expenseValidators";
import { parseExpenseTextSchema } from "../validators/aiValidators";
import * as expenseController from "../controllers/expenseController";
import { parseExpenseText } from "../controllers/aiController";
import { detectRecurring, confirmRecurring } from "../controllers/recurringController";
import { aiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.use(requireAuth);

router.post("/parse", aiRateLimiter, validate(parseExpenseTextSchema), parseExpenseText);
router.get("/recurring/detect", detectRecurring);
router.post("/recurring/confirm", confirmRecurring);
router.get("/", validateQuery(listExpensesQuerySchema), expenseController.listExpenses);
router.post("/", validate(createExpenseSchema), expenseController.createExpense);
router.get("/:id", expenseController.getExpense);
router.put("/:id", validate(updateExpenseSchema), expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

export default router;
