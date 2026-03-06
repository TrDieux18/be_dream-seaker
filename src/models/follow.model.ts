import mongoose from "mongoose";
import { Schema } from "mongoose";



export interface FollowDocument extends Document {
   followerId: mongoose.Types.ObjectId;
   followingId: mongoose.Types.ObjectId;
   createdAt: Date;
   updatedAt: Date;
}

const followSchema = new Schema<FollowDocument>(
   {
      followerId: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: true
      },
      followingId: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: true
      }
   },
   {
      timestamps: true
   }
);

followSchema.index(
   { followerId: 1, followingId: 1 },
   { unique: true }
);


followSchema.pre("save", function (next) {
   if (this.followerId.equals(this.followingId)) {
      return next(new Error("You cannot follow yourself"));
   }
   next();
});

export default mongoose.model("Follow", followSchema, "follows");