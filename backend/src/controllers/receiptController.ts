import { Response } from "express";
import fs from "fs/promises";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import { ApiError } from "../utils/ApiError";
import { processReceiptImage } from "../services/receiptService";
import { suggestCategory } from "../services/categorizationService";
import { receiptImagePublicUrl } from "../middleware/uploadMiddleware";

export const processReceipt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new ApiError(400, "No receipt image was uploaded");
  }

  const receiptUrl = receiptImagePublicUrl(file.filename);

  try {
    const imageBuffer = await fs.readFile(file.path);
    const result = await processReceiptImage(imageBuffer, receiptUrl);

    if (result.merchant) {
      const suggestion = await suggestCategory(req.userId!, result.merchant, result.rawText);
      if (suggestion.source === "user-rule") {
        result.category = suggestion.category;
        result.confidence = Math.max(result.confidence, suggestion.confidence);
      }
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    throw new ApiError(
      422,
      "Couldn't read this receipt clearly. You can still add the expense manually.",
      { receiptUrl, originalError: err instanceof Error ? err.message : String(err) }
    );
  }
});
