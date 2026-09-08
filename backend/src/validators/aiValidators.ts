import { z } from "zod";

export const parseExpenseTextSchema = z.object({
  text: z.string().trim().min(3, "Tell me a bit more about what you spent").max(500),
});

export type ParseExpenseTextInput = z.infer<typeof parseExpenseTextSchema>;
