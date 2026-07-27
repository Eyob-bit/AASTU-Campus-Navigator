import { z } from "zod";

export const createAliasSchema = z.object({
    alias: z.string().trim().min(2).max(100),
});

export const updateAliasSchema = z.object({
    alias: z.string().trim().min(2).max(100).optional(),
});
