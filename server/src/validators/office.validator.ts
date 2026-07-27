import { z } from "zod";

export const createOfficeSchema = z.object({
    name: z.string().min(2).max(100),
    roomNumber: z.string().min(1).max(20),
    description: z.string().max(500).nullable().optional(),
});

export const updateOfficeSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    roomNumber: z.string().min(1).max(20).optional(),
    description: z.string().max(500).nullable().optional(),
});
