import { z } from "zod";

export const assistantChatSchema = z.object({
  question: z.string().trim().min(3).max(300),
});

export type AssistantChatInput = z.infer<typeof assistantChatSchema>;
