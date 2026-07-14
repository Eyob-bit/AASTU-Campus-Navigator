import { z } from "zod";

export const createFloorSchema = z.object({
    floorNumber: z.number().int(),
});

export const updateFloorSchema = z.object({
    floorNumber: z.number().int(),
});
