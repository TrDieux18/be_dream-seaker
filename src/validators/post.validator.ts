import { z } from "zod";

export const createPostSchema = z.object({
   caption: z.string().optional(),
   images: z.array(z.string()).min(1, "At least one image is required").max(10, "Maximum 10 images allowed"),
   location: z.string().optional()
});

export const updatePostSchema = z.object({
   caption: z.string().optional(),
   location: z.string().optional()
});

export const postIdSchema = z.object({
   postId: z.string().min(1, "Post ID is required")
});
