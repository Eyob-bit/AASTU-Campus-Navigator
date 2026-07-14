import { z } from "zod";

const keyRegex = /^[a-z0-9-]+$/;

export const createSceneSchema = z.object({
    name: z.string().trim().min(2).max(100),
    key: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .regex(keyRegex, "Key must only contain lowercase letters, numbers, and hyphens"),
    imagePath: z.string().trim().min(1, "imagePath is required"),
    imageFilename: z.string().trim().max(255).nullable().optional(),
    displayOrder: z.number().int().min(0, "displayOrder must be a non-negative integer").default(0),
    isEntryScene: z.boolean().default(false),
});

export const updateSceneSchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    key: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .regex(keyRegex, "Key must only contain lowercase letters, numbers, and hyphens")
        .optional(),
    imagePath: z.string().trim().min(1).optional(),
    imageFilename: z.string().trim().max(255).nullable().optional(),
    displayOrder: z.number().int().min(0, "displayOrder must be a non-negative integer").optional(),
    isEntryScene: z.boolean().optional(),
});
