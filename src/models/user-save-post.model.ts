import mongoose, { Schema } from "mongoose";

export interface UserSavePostDocument extends Document {
   userId: mongoose.Schema.Types.ObjectId;
   postId: mongoose.Schema.Types.ObjectId;
   targetType: "user" | "post";
   createdAt: Date;
}

const UserSavePostSchema = new Schema<UserSavePostDocument>(
   {
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true
      },
      postId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Post",
         required: true
      },

      createdAt: { type: Date, default: Date.now },
   }
)

UserSavePostSchema.index(
   { userId: 1, postId: 1 },
   { unique: true }
);
const UserSavePostModel = mongoose.model<UserSavePostDocument>("UserSavePost", UserSavePostSchema, "user-save-post");
export default UserSavePostModel;
