import { z } from "zod";

export const searchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Search query must be at least 2 characters long")
    .max(100, "Search query must not exceed 100 characters"),
});

export type SearchFormValues = z.infer<typeof searchSchema>;
