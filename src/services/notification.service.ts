import { kafkaProducer } from "../lib/kafka";
import NotificationModel from "../models/notification.model";
import UserModel from "../models/user.model";
import { valkey } from "../lib/valkey";
import { getSocketIO } from "../lib/socket";

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

   if (actorId === recipientId) {
      return null;
   }

   const payload = { actorId, recipientId, type, postId };

   try {
      await kafkaProducer.send({
         topic: "notification-events",
         messages: [{ value: JSON.stringify(payload) }],
      });

      console.log("📨 Published notification event to Kafka:", payload);
      return null;
   } catch (error) {
      console.error("⚠️ Error publishing notification to Kafka, falling back to direct database creation:", error);

      try {
         // Graceful fallback: Save directly to database
         const created = await NotificationModel.create({
            actor: actorId,
            recipient: recipientId,
            type,
            post: postId,
            read: false
         });

         // Invalidate notification cache for recipient
         await clearNotificationCache(recipientId);

         // Populate actor and post details for Socket.io
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
         console.log("✅ Fallback processed and dispatched notification directly:", notification);
         return null;
      } catch (fallbackError) {
         console.error("❌ Fallback notification creation also failed:", fallbackError);
         // Do not throw error so the primary action (e.g. follow, like, comment) doesn't fail
         return null;
      }
   }
}

export const clearNotificationCache = async (userId: string) => {
   try {
      await valkey.del(`user:notifications:unread-count:${userId}`);
      const keys = await valkey.keys(`user:notifications:${userId}:*`);
      if (keys.length > 0) {
         await valkey.del(keys);
      }
   } catch (error) {
      console.error("Error clearing notification cache for user:", userId, error);
   }
};

export const getNotificationService = async (userId: string, page: number = 1, limit: number = 15) => {
   const user = await UserModel.findById(userId);

   if (!user) {
      throw new Error("User not found");
   }

   const cacheKey = `user:notifications:${userId}:page:${page}:limit:${limit}`;
   try {
      const cached = await valkey.get(cacheKey);
      if (cached) {
         return JSON.parse(cached);
      }
   } catch (error) {
      console.error("Valkey get notification error:", error);
   }

   const notifications = await NotificationModel.find({ recipient: userId })
      .populate("actor", "username avatar")
      .populate("post", "caption")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

   const total = await NotificationModel.countDocuments({ recipient: userId });

   const result = { notifications, total };

   try {
      await valkey.set(cacheKey, JSON.stringify(result), "EX", 600);
   } catch (error) {
      console.error("Valkey set notification error:", error);
   }

   return result;
}

export const getUnreadCountService = async (userId: string) => {
   const cacheKey = `user:notifications:unread-count:${userId}`;
   try {
      const cached = await valkey.get(cacheKey);
      if (cached) {
         return JSON.parse(cached);
      }
   } catch (error) {
      console.error("Valkey get unread count error:", error);
   }

   const count = await NotificationModel.countDocuments({ recipient: userId, read: false });
   const result = { unreadCount: count };

   try {
      await valkey.set(cacheKey, JSON.stringify(result), "EX", 600);
   } catch (error) {
      console.error("Valkey set unread count error:", error);
   }

   return result;
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

   await clearNotificationCache(userId);

   return notification;
}

export const markAllNotificationsAsReadService = async (userId: string) => {
   const result = await NotificationModel.updateMany(
      { recipient: userId, read: false },
      { read: true }
   );

   await clearNotificationCache(userId);

   return result;
}