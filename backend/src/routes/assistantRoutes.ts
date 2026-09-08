import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { assistantChatSchema } from "../validators/assistantValidators";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { chat } from "../controllers/assistantController";

const router = Router();
router.use(requireAuth);
router.post("/chat", aiRateLimiter, validate(assistantChatSchema), chat);

export default router;
