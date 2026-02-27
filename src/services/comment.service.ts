import CommentModel from "../models/comment.model";
import PostModel from "../models/post.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import { getSocketIO } from "../lib/socket";

export const createCommentService = async (
   postId: string,
   userId: string,
   body: {
      content: string;
      parentCommentId?: string;
   }
) => {
   const post = await PostModel.findById(postId);
   if (!post) throw new NotFoundException("Post not found");



   if (body.parentCommentId) {
      const parentComment = await CommentModel.findById(body.parentCommentId);
      if (!parentComment) throw new NotFoundException("Parent comment not found");
      if (parentComment.post.toString() !== postId) {
         throw new BadRequestException("Parent comment does not belong to this post");
      }
   }

   const comment = await CommentModel.create({
      post: postId,
      user: userId,
      content: body.content,
      parentComment: body.parentCommentId || null
   });


   post.commentsCount += 1;
   await post.save();

   const populatedComment = await comment.populate("user", "name avatar");


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

   // Get top-level comments only (no parent)
   const comments = await CommentModel.find({ post: postId, parentComment: null })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

   const total = await CommentModel.countDocuments({ post: postId, parentComment: null });

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

export const getRepliesService = async (commentId: string) => {
   const parentComment = await CommentModel.findById(commentId);
   if (!parentComment) throw new NotFoundException("Comment not found");

   const replies = await CommentModel.find({ parentComment: commentId })
      .populate("user", "name avatar")
      .sort({ createdAt: 1 })
      .lean();

   return replies;
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

export const likeCommentService = async (commentId: string, userId: string) => {
   const comment = await CommentModel.findById(commentId);

   if (!comment) throw new NotFoundException("Comment not found");

   const alreadyLiked = comment.likes.includes(userId as any);

   if (alreadyLiked) {
      throw new BadRequestException("You already liked this comment");
   }

   comment.likes.push(userId as any);
   comment.likesCount = comment.likes.length;
   await comment.save();

   return comment;
};

export const unlikeCommentService = async (commentId: string, userId: string) => {
   const comment = await CommentModel.findById(commentId);

   if (!comment) throw new NotFoundException("Comment not found");

   const likeIndex = comment.likes.findIndex((id) => id.toString() === userId);

   if (likeIndex === -1) {
      throw new BadRequestException("You have not liked this comment");
   }

   comment.likes.splice(likeIndex, 1);
   comment.likesCount = comment.likes.length;
   await comment.save();

   return comment;
};
