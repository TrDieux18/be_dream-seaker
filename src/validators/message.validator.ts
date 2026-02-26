import { z } from "zod";

export const sendMessageSchema = z.object({
   chatId: z.string().trim().min(1),
   content: z.string().trim().optional(),
   image: z.string().trim().optional(),
   replyToId: z.string().trim().optional()
})
   .refine((data) => data.content || data.image, {
      message: "Either content or image must be provided",
      path: ["content"]
   })

export const messageIdSchema = z.object({
   id: z.string().trim().min(1)
});

export const editMessageSchema = z.object({
   messageId: z.string().trim().min(1),
   content: z.string().trim().min(1, "Message content cannot be empty")
});
