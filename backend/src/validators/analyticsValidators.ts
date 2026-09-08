import { z } from "zod";

export const dateRangeQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const trendsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).optional().default(6),
});

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
export type TrendsQuery = z.infer<typeof trendsQuerySchema>;
