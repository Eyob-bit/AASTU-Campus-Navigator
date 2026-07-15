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
    displayOrder: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === "") return 0;
            return typeof val === "string" ? parseInt(val, 10) : val;
        },
        z.number().int().min(0, "displayOrder must be a non-negative integer")
    ).default(0),
    isEntryScene: z.preprocess(
        (val) => {
            if (val === "true") return true;
            if (val === "false") return false;
            if (val === undefined || val === null || val === "") return false;
            return val;
        },
        z.boolean()
    ).default(false),
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
    displayOrder: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === "") return undefined;
            return typeof val === "string" ? parseInt(val, 10) : val;
        },
        z.number().int().min(0, "displayOrder must be a non-negative integer").optional()
    ).optional(),
    isEntryScene: z.preprocess(
        (val) => {
            if (val === "true") return true;
            if (val === "false") return false;
            if (val === undefined || val === null || val === "") return undefined;
            return val;
        },
        z.boolean().optional()
    ).optional(),
});
