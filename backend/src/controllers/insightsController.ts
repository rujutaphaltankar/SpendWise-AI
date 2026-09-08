import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import { generateInsight } from "../services/insightsService";

export const getInsight = asyncHandler(async (req: AuthRequest, res: Response) => {
  const insight = await generateInsight(req.userId!);
  res.status(200).json({ success: true, data: insight });
});
