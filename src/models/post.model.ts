import mongoose, { Document, Schema } from "mongoose";

export interface PostDocument extends Document {
   user: mongoose.Types.ObjectId;
   caption?: string;
   images: string[];
   location?: string;
   likes: mongoose.Types.ObjectId[];
   likesCount: number;
   commentsCount: number;
   createdAt: Date;
   updatedAt: Date;
}

const postSchema = new Schema<PostDocument>(
   {
      user: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: true
      },
      caption: {
         type: String,
         default: ""
      },
      images: {
         type: [String],
         required: true,
         validate: {
            validator: function (v: string[]) {
               return v && v.length > 0 && v.length <= 10;
            },
            message: "A post must have between 1 and 10 images"
         }
      },
      location: {
         type: String,
         default: ""
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
      commentsCount: {
         type: Number,
         default: 0
      }
   },
   {
      timestamps: true
   }
);

// Index for efficient querying
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

const PostModel = mongoose.model<PostDocument>("Post", postSchema, "posts");
export default PostModel;
