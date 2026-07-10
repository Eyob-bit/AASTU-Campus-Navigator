import { z } from "zod";

export const createBuildingSchema = z.object({
    name: z.string().min(3).max(100),

    code: z
        .string()
        .min(2)
        .max(10)
        .transform((value) => value.toUpperCase()),

    entranceLatitude: z.number(),

    entranceLongitude: z.number(),

    entranceImage: z.string().optional(),

    coverImage: z.string().optional(),
});