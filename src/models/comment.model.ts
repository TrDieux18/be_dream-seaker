import mongoose, { Document, Schema } from "mongoose";

export interface CommentDocument extends Document {
   post: mongoose.Types.ObjectId;
   user: mongoose.Types.ObjectId;
   content: string;
   likes: mongoose.Types.ObjectId[];
   likesCount: number;
   parentComment?: mongoose.Types.ObjectId;
   createdAt: Date;
   updatedAt: Date;
}

const commentSchema = new Schema<CommentDocument>(
   {
      post: {
         type: Schema.Types.ObjectId,
         ref: "Post",
         required: true
      },
      user: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: true
      },
      content: {
         type: String,
         required: true,
         trim: true
      },
      likes: [
         {
            type: Schema.Types.ObjectId,
            ref: "User"
         }
      ],
      likesCount: {
         type: Number,
         default: 0
      },
      parentComment: {
         type: Schema.Types.ObjectId,
         ref: "Comment",
         default: null
      }
   },
   {
      timestamps: true
   }
);

// Index for efficient querying
commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ parentComment: 1 });

const CommentModel = mongoose.model<CommentDocument>("Comment", commentSchema, "comments");
export default CommentModel;
