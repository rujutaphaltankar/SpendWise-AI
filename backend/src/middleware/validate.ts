import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      return next(new ApiError(400, "Validation failed", details));
    }
    req.body = result.data;
    next();
  };
}

// Query strings are always strings, so schemas passed here should use
// z.coerce for numbers/dates and enums for the rest.
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      return next(new ApiError(400, "Invalid query parameters", details));
    }
    // Cast away readonly: Express's req.query type doesn't match our parsed shape,
    // but we control every consumer of this property downstream.
    (req as any).validatedQuery = result.data;
    next();
  };
}
