import { z } from "zod";


export const notificationIdSchema = z.object({
   notificationId: z.string().trim().min(1, "Notification ID is required"),
});

export const notificationListQuerySchema = z.object({
   page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
   limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
});

