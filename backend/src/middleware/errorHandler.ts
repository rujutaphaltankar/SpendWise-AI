import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large. Maximum size is 5MB." : "File upload failed";
    return res.status(400).json({ success: false, message });
  }

  if (typeof err === "object" && err !== null && (err as any).code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
      details: (err as any).keyValue,
    });
  }

  // eslint-disable-next-line no-console
  console.error("[unhandled error]", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(env.nodeEnv === "development" && {
      stack: err instanceof Error ? err.stack : undefined,
    }),
  });
}
