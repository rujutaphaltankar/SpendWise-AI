import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import { answerQuestion } from "../services/assistantService";
import { AssistantChatInput } from "../validators/assistantValidators";

export const chat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { question } = req.body as AssistantChatInput;
  const response = await answerQuestion(req.userId!, question);
  res.status(200).json({ success: true, data: response });
});
