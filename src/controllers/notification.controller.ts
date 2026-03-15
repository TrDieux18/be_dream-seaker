import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { notificationIdSchema, notificationListQuerySchema } from "../validators/notification.validator";
import { HTTPSTATUS } from "../config/http.config";
import { getNotificationService, getUnreadCountService, markAllNotificationsAsReadService, markNotificationAsReadService } from "../services/notification.service";

export const getNotificationsController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";

      const { page, limit } = notificationListQuerySchema.parse(req.query);

      const result = await getNotificationService(userId, page, limit);

      return res.status(HTTPSTATUS.OK).json({
         message: "Notifications retrieved successfully",
         ...result,
      });
   }
);

export const getUnreadCountController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";

      const result = await getUnreadCountService(userId);
      return res.status(HTTPSTATUS.OK).json({
         message: "Unread notifications count retrieved successfully",
         ...result,
      });
   }
);

export const markNotificationAsReadController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const { notificationId } = notificationIdSchema.parse(req.params);

      const notification = await markNotificationAsReadService(userId, notificationId);
      return res.status(HTTPSTATUS.OK).json({
         message: "Notification marked as read",
         notification,
      });
   }
);


export const markAllNotificationsAsReadController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const notifications = await markAllNotificationsAsReadService(userId);

      return res.status(HTTPSTATUS.OK).json({
         message: "All notifications marked as read",
         ...notifications,
      });
   }
);