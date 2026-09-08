import { Router } from "express";
import authRoutes from "./authRoutes";
import expenseRoutes from "./expenseRoutes";
import incomeRoutes from "./incomeRoutes";
import analyticsRoutes from "./analyticsRoutes";
import receiptRoutes from "./receiptRoutes";
import budgetRoutes from "./budgetRoutes";
import savingsGoalRoutes from "./savingsGoalRoutes";
import predictionRoutes from "./predictionRoutes";
import insightsRoutes from "./insightsRoutes";
import assistantRoutes from "./assistantRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/expenses", expenseRoutes);
router.use("/income", incomeRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/receipts", receiptRoutes);
router.use("/budgets", budgetRoutes);
router.use("/goals", savingsGoalRoutes);
router.use("/predictions", predictionRoutes);
router.use("/insights", insightsRoutes);
router.use("/assistant", assistantRoutes);

export default router;
