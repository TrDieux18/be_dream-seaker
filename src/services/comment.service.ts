import CommentModel from "../models/comment.model";
import PostModel from "../models/post.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import { getSocketIO } from "../lib/socket";
import { createNotification } from "./notification.service";

export const createCommentService = async (
   postId: string,
   userId: string,
   body: {
      content: string;
   }
) => {
   const post = await PostModel.findById(postId);
   if (!post) throw new NotFoundException("Post not found");

   const comment = await CommentModel.create({
      post: postId,
      user: userId,
      content: body.content,
   });


   post.commentsCount += 1;
   await post.save();

   const populatedComment = await comment.populate("user", "name avatar");

   await createNotification({
      actorId: userId,
      recipientId: post.user._id.toString(),
      type: "comment",
      postId
   });


   const io = getSocketIO();
   if (io) {
      io.emit(`post:${postId}:new-comment`, {
         postId,
         comment: populatedComment,
         commentsCount: post.commentsCount
      });
   }

   return populatedComment;
};

export const getCommentsService = async (postId: string, page: number = 1, limit: number = 20) => {
   const post = await PostModel.findById(postId);
   if (!post) throw new NotFoundException("Post not found");

   const skip = (page - 1) * limit;

   const comments = await CommentModel.find({ post: postId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

   const total = await CommentModel.countDocuments({ post: postId });

   return {
      comments,
      pagination: {
         page,
         limit,
         total,
         pages: Math.ceil(total / limit)
      }
   };
};

export const deleteCommentService = async (commentId: string, userId: string) => {
   const comment = await CommentModel.findById(commentId);

   if (!comment) throw new NotFoundException("Comment not found");

   if (comment.user.toString() !== userId) {
      throw new BadRequestException("You are not authorized to delete this comment");
   }

   const postId = comment.post;

   // Delete all replies to this comment
   await CommentModel.deleteMany({ parentComment: commentId });

   // Delete the comment
   await comment.deleteOne();

   // Update post comments count
   const post = await PostModel.findById(postId);
   if (post) {
      const commentsCount = await CommentModel.countDocuments({ post: postId });
      post.commentsCount = commentsCount;
      await post.save();
   }

   return { message: "Comment deleted successfully" };
};
