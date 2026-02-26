import { z } from "zod"

export const createChatSchema = z.object({
   participantId: z.string().trim().min(1).optional(),
   isGroup: z.boolean().optional(),
   participants: z.array(z.string().trim().min(1)).optional(),
   groupName: z.string().trim().min(1).optional()
});

export const chatIdSchema = z.object({
   id: z.string().trim().min(1)
})

export const updateGroupImageSchema = z.object({
   chatId: z.string().trim().min(1),
   image: z.string().trim().min(1)
});

export const updateGroupNameSchema = z.object({
   chatId: z.string().trim().min(1),
   groupName: z.string().trim().min(1)
});

export const chatIdBodySchema = z.object({
   chatId: z.string().trim().min(1)
});

export const paginationQuerySchema = z.object({
   limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
   offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : 0)
});
