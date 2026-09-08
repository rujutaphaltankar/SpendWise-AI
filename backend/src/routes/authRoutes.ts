import { Router } from "express";
import {
  register,
  login,
  refresh,
  getMe,
  updateProfile,
  logout,
} from "../controllers/authController";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, updateProfileSchema } from "../validators/authValidators";
import { requireAuth } from "../middleware/authMiddleware";
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), register);
router.post("/login", authRateLimiter, validate(loginSchema), login);
router.post("/refresh", authRateLimiter, refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, validate(updateProfileSchema), updateProfile);

export default router;
