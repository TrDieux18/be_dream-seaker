import { z } from "zod";

export const createCommentSchema = z.object({
   content: z.string().min(1, "Comment content is required").trim()
});

export const commentIdSchema = z.object({
   commentId: z.string().min(1, "Comment ID is required")
});
