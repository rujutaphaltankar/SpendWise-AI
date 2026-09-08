import { Response } from "express";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens";
import { AuthRequest } from "../middleware/authMiddleware";
import { RegisterInput, LoginInput, UpdateProfileInput } from "../validators/authValidators";

function buildAuthResponse(user: InstanceType<typeof User>) {
  const accessToken = signAccessToken({ userId: user.id });
  const refreshToken = signRefreshToken({ userId: user.id });
  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
}

export const register = asyncHandler(async (req, res: Response) => {
  const body = req.body as RegisterInput;

  const existing = await User.findOne({ email: body.email });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({
    name: body.name,
    email: body.email,
    password: body.password,
    currency: body.currency ?? "INR",
    monthlyIncome: body.monthlyIncome ?? 0,
    savingsGoalAmount: body.savingsGoalAmount ?? 0,
  });

  res.status(201).json({
    success: true,
    data: buildAuthResponse(user),
  });
});

export const login = asyncHandler(async (req, res: Response) => {
  const body = req.body as LoginInput;

  const user = await User.findOne({ email: body.email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.comparePassword(body.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  res.status(200).json({
    success: true,
    data: buildAuthResponse(user),
  });
});

export const refresh = asyncHandler(async (req, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  res.status(200).json({
    success: true,
    data: buildAuthResponse(user),
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  res.status(200).json({ success: true, data: user.toJSON() });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as UpdateProfileInput;

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: body },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({ success: true, data: user.toJSON() });
});

export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
  // Stateless JWT: logout is handled client-side by discarding tokens.
  // Included as an explicit endpoint so the frontend has a consistent flow
  // and so a token-blacklist can be added later without changing the API shape.
  res.status(200).json({ success: true, message: "Logged out" });
});
