import { z } from "zod";

export const followUserIdSchema = z.object({
   userIdToFollow: z.string().trim().min(1, "User ID to follow is required")
})