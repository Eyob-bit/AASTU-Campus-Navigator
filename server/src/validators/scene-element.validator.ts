import { z } from "zod";

export const createSceneElementSchema = z.object({
    type: z.enum(["ARROW", "OFFICE_LABEL", "INFORMATION"]),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    rotation: z.number().min(0).max(360).nullable().optional(),
    displayOrder: z.number().int().min(0),
    isVisible: z.boolean().default(true),
    label: z.string().trim().min(1).max(255).nullable().optional(),
    officeId: z.string().trim().min(1).nullable().optional(),
    nextSceneId: z.string().trim().min(1).nullable().optional(),
});

export const updateSceneElementSchema = z.object({
    type: z.enum(["ARROW", "OFFICE_LABEL", "INFORMATION"]).optional(),
    x: z.number().min(0).max(1).optional(),
    y: z.number().min(0).max(1).optional(),
    rotation: z.number().min(0).max(360).nullable().optional(),
    displayOrder: z.number().int().min(0).optional(),
    isVisible: z.boolean().optional(),
    label: z.string().trim().min(1).max(255).nullable().optional(),
    officeId: z.string().trim().min(1).nullable().optional(),
    nextSceneId: z.string().trim().min(1).nullable().optional(),
});
