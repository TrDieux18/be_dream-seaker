import mongoose, { Document, Schema } from "mongoose";

export interface NotificatonDocument extends Document {
   actor: mongoose.Schema.Types.ObjectId;
   recipient: mongoose.Schema.Types.ObjectId;
   type: "like" | "comment" | "follow";
   post?: mongoose.Schema.Types.ObjectId;
   read: boolean;
   createdAt: Date;
}


const NotificationSchema = new Schema<NotificatonDocument>(
   {
      actor: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true
      },
      recipient: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true
      },
      type: {
         type: String,
         enum: ["like", "comment", "follow"],
         required: true
      },
      post: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Post"
      },
      read: {
         type: Boolean,
         default: false
      },
      createdAt: { type: Date, default: Date.now },
   }
)

NotificationSchema.index(
   { recipient: 1, createdAt: -1, read: 1 }
)

const NotificationModel = mongoose.model<NotificatonDocument>("Notification", NotificationSchema, "notification");
export default NotificationModel; 
