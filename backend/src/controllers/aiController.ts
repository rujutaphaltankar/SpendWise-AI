import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import { extractExpenseFromText } from "../services/aiService";
import { suggestCategory } from "../services/categorizationService";
import { ParseExpenseTextInput } from "../validators/aiValidators";
import { ApiError } from "../utils/ApiError";

export const parseExpenseText = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { text } = req.body as ParseExpenseTextInput;

  try {
    const extracted = await extractExpenseFromText(text);

    if (extracted.merchant && extracted.merchant !== "Unknown merchant") {
      const suggestion = await suggestCategory(req.userId!, extracted.merchant, text);
      if (suggestion.source === "user-rule") {
        extracted.category = suggestion.category;
        extracted.confidence = Math.max(extracted.confidence, suggestion.confidence);
      }
    }

    res.status(200).json({ success: true, data: extracted });
  } catch (err) {
    throw new ApiError(
      422,
      "Couldn't confidently understand that expense. Try rephrasing, or enter it manually.",
      { originalError: err instanceof Error ? err.message : String(err) }
    );
  }
});
