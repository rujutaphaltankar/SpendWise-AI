import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import * as predictionService from "../services/predictionService";

export const getMonthlyPrediction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const prediction = await predictionService.getMonthlySpendingPrediction(req.userId!);
  res.status(200).json({ success: true, data: prediction });
});

export const getCategoryForecasts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const forecasts = await predictionService.getCategoryForecasts(req.userId!);
  res.status(200).json({ success: true, data: forecasts });
});

export const getAnomalies = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await predictionService.getAnomalies(req.userId!);
  res.status(200).json({ success: true, data: result });
});
