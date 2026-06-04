import { kafkaConsumer } from "../lib/kafka";
import NotificationModel from "../models/notification.model";
import { getSocketIO } from "../lib/socket";
import { clearNotificationCache } from "../services/notification.service";

export const startNotificationConsumer = async () => {
   try {
      await kafkaConsumer.subscribe({ topic: "notification-events", fromBeginning: true });

      await kafkaConsumer.run({
         eachMessage: async ({ message }) => {
            if (!message.value) return;

            try {
               const payload = JSON.parse(message.value.toString());
               const { actorId, recipientId, type, postId } = payload;

               // Save to MongoDB
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
               console.log("✅ Consumer processed and dispatched notification:", notification);
            } catch (err) {
               console.error("❌ Error processing notification event:", err);
            }
         },
      });
      console.log("⚙️ Notification Consumer running...");
   } catch (err) {
      console.error("❌ Failed to start Notification Consumer:", err);
   }
};
