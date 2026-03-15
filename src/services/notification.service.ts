import { getSocketIO } from "../lib/socket";
import NotificationModel from "../models/notification.model";
import UserModel from "../models/user.model";

export type NotificationType = "like" | "comment" | "follow";

interface CreateNotificationInput {
   actorId: string;
   recipientId: string;
   type: NotificationType;
   postId?: string;
}

export const createNotification = async ({
   actorId,
   recipientId,
   type,
   postId
}: CreateNotificationInput) => {

   try {
      if (actorId === recipientId) {
         return null;
      }

      const created = await NotificationModel.create({
         actor: actorId,
         recipient: recipientId,
         type,
         post: postId,
         read: false
      });

      const notification = await NotificationModel.findById(created._id)
         .populate("actor", "username avatar")
         .populate("post", "caption")
         .lean();

      if (notification) {
         const io = getSocketIO();
         if (io) {
            io.to(`user:${recipientId}`).emit("notification:new", notification);
         }
      }

      return notification;
   } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
   }
}

export const getNotificationService = async (userId: string, page: number = 1, limit: number = 15) => {
   const user = await UserModel.findById(userId);

   if (!user) {
      throw new Error("User not found");
   }

   const notifications = await NotificationModel.find({ recipient: userId })
      .populate("actor", "username avatar")
      .populate("post", "caption")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

   const total = await NotificationModel.countDocuments({ recipient: userId });

   return { notifications, total };


}

export const getUnreadCountService = async (userId: string) => {
   const count = await NotificationModel.countDocuments({ recipient: userId, read: false });
   return { unreadCount: count };
}


export const markNotificationAsReadService = async (userId: string, notificationId: string) => {
   const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
   )
      .populate("actor", "username avatar")
      .populate("post", "caption")
      .lean();

   if (!notification) {
      throw new Error("Notification not found or you don't have permission to mark it as read");
   }

   return notification;
}

export const markAllNotificationsAsReadService = async (userId: string) => {
   const result = await NotificationModel.updateMany(
      { recipient: userId, read: false },
      { read: true }
   );
   return result;
}