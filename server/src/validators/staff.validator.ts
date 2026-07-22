import { z } from "zod";

export const createStaffSchema = z.object({
    fullName: z.string().min(2).max(100),
    position: z.string().min(2).max(100),
    email: z.string().email("Must be a valid email address").max(100).nullable().optional(),
    phone: z.string().min(8).max(20).nullable().optional(),
});

export const updateStaffSchema = z.object({
    fullName: z.string().min(2).max(100).optional(),
    position: z.string().min(2).max(100).optional(),
    email: z.string().email("Must be a valid email address").max(100).nullable().optional(),
    phone: z.string().min(8).max(20).nullable().optional(),
    officeId: z.string().optional(),
});
