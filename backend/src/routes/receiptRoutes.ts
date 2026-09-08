import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { uploadReceiptImage } from "../middleware/uploadMiddleware";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { processReceipt } from "../controllers/receiptController";

const router = Router();
router.use(requireAuth);
router.post("/process", aiRateLimiter, uploadReceiptImage, processReceipt);

export default router;
