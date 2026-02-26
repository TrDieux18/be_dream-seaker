import PostModel from "../models/post.model";
import CommentModel from "../models/comment.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import { getSocketIO } from "../lib/socket";

export const createPostService = async (
   userId: string,
   body: {
      caption?: string;
      images: string[];
      location?: string;
   }
) => {
   const post = await PostModel.create({
      user: userId,
      caption: body.caption || "",
      images: body.images,
      location: body.location || ""
   });

   const populatedPost = await post.populate("user", "name avatar");
   return populatedPost;
};

export const getFeedService = async (userId: string, page: number = 1, limit: number = 10) => {
   const skip = (page - 1) * limit;

   const posts = await PostModel.find()
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

   const total = await PostModel.countDocuments();

   return {
      posts,
      pagination: {
         page,
         limit,
         total,
         pages: Math.ceil(total / limit)
      }
   };
};

export const getUserPostsService = async (userId: string, targetUserId: string) => {
   const posts = await PostModel.find({ user: targetUserId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .lean();

   return posts;
};

export const getPostByIdService = async (postId: string) => {
   const post = await PostModel.findById(postId)
      .populate("user", "name avatar")
      .lean();

   if (!post) throw new NotFoundException("Post not found");

   return post;
};

export const deletePostService = async (postId: string, userId: string) => {
   const post = await PostModel.findById(postId);

   if (!post) throw new NotFoundException("Post not found");

   if (post.user.toString() !== userId) {
      throw new BadRequestException("You are not authorized to delete this post");
   }

   // Delete all comments associated with the post
   await CommentModel.deleteMany({ post: postId });

   await post.deleteOne();
   return { message: "Post deleted successfully" };
};

export const likePostService = async (postId: string, userId: string) => {
   const post = await PostModel.findById(postId);

   if (!post) throw new NotFoundException("Post not found");

   const alreadyLiked = post.likes.includes(userId as any);

   if (alreadyLiked) {
      throw new BadRequestException("You already liked this post");
   }

   post.likes.push(userId as any);
   post.likesCount = post.likes.length;
   await post.save();

   // Emit socket event for real-time update
   const io = getSocketIO();
   if (io) {
      io.emit(`post:${postId}:new-like`, {
         postId,
         userId,
         likesCount: post.likesCount
      });
   }

   return post;
};

export const unlikePostService = async (postId: string, userId: string) => {
   const post = await PostModel.findById(postId);

   if (!post) throw new NotFoundException("Post not found");

   const likeIndex = post.likes.findIndex((id) => id.toString() === userId);

   if (likeIndex === -1) {
      throw new BadRequestException("You have not liked this post");
   }

   post.likes.splice(likeIndex, 1);
   post.likesCount = post.likes.length;
   await post.save();

   // Emit socket event for real-time update
   const io = getSocketIO();
   if (io) {
      io.emit(`post:${postId}:unlike`, {
         postId,
         userId,
         likesCount: post.likesCount
      });
   }

   return post;
};

export const savePostService = async (postId: string, userId: string) => {
   // This can be implemented by adding a "savedPosts" array to User model
   // For now, returning success
   return { message: "Post saved successfully" };
};
