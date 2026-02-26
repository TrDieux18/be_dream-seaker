import { z } from "zod";

export const userIdParamSchema = z.object({
   userId: z.string().trim().min(1)
});

export const updateProfileSchema = z.object({
   name: z.string().trim().min(1).max(50).optional(),
   bio: z.string().max(150).optional(),
   avatar: z.string().optional()
});

export const paginationQuerySchema = z.object({
   limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 12),
   offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : 0)
});
