import PostModel from "../models/post.model";
import CommentModel from "../models/comment.model";
import FollowModel from "../models/follow.model";
import { BadRequestException, InternalServerException, NotFoundException } from "../utils/app-error";
import { getSocketIO } from "../lib/socket";
import UserSavePostModel from "../models/user-save-post.model";
import { createNotification } from "./notification.service";
import cloudinary from "../config/cloudinary.config";
import { extractCloudinaryPublicIdFromUrl, isBase64ImageDataUrl, isWebUrl } from "../utils/cloudinary-image";
import { valkey } from "../lib/valkey";

const FEED_USER_FIELDS = "name username avatar";

const POST_POPULATE_OPTIONS = {
   path: "user",
   select: FEED_USER_FIELDS
} as const;

export const createPostService = async (
   userId: string,
   body: {
      caption?: string;
      images: string[];
      location?: string;
   }
) => {
   let uploadedImageUrls: string[];

   try {
      uploadedImageUrls = await Promise.all(
         body.images.map(async (image) => {
            // Keep pre-uploaded URLs, upload only base64/local payloads.
            if (isWebUrl(image)) {
               return image;
            }

            if (!isBase64ImageDataUrl(image)) {
               throw new BadRequestException("Invalid image format. Expected image URL or base64 data URL");
            }

            const uploadRes = await cloudinary.uploader.upload(image, {
               folder: "post-images",
               resource_type: "image",
               transformation: [{ quality: "auto" }]
            });

            return uploadRes.secure_url;
         })
      );
   } catch (error) {
      console.error("Cloudinary post upload error:", error);
      if (error instanceof BadRequestException) {
         throw error;
      }

      throw new InternalServerException("Failed to upload one or more images");
   }

   const post = await PostModel.create({
      user: userId,
      caption: body.caption || "",
      images: uploadedImageUrls,
      location: body.location || ""
   });

   const populatedPost = await post.populate("user", "name avatar");

   // Invalidate cache
   await invalidateUserFeedAndFollowers(userId);

   return populatedPost;
};

const invalidateUserFeedAndFollowers = async (userId: string) => {
   try {
      // 1. Delete author's profile cache
      await valkey.del(`user:profile:${userId}`);

      // 2. Delete author's feed cache
      const authorFeedKeys = await valkey.keys(`user:feed:${userId}:*`);
      if (authorFeedKeys.length > 0) {
         await valkey.del(authorFeedKeys);
      }

      // 3. Find followers and delete their feed caches
      const followers = await FollowModel.find({ followingId: userId }).select("followerId").lean();
      if (followers.length > 0) {
         const deletePromises = followers.map(async (follower) => {
            const followerFeedKeys = await valkey.keys(`user:feed:${follower.followerId.toString()}:*`);
            if (followerFeedKeys.length > 0) {
               await valkey.del(followerFeedKeys);
            }
         });
         await Promise.all(deletePromises);
      }
   } catch (err) {
      console.error("Valkey invalidate feed and profile error:", err);
   }
};

const getPrioritizedFeedPosts = async (userIds: string[], skip: number, limit: number) => {
   const [posts, total] = await Promise.all([
      PostModel.find({ user: { $in: userIds } })
         .populate(POST_POPULATE_OPTIONS)
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(limit)
         .lean(),
      PostModel.countDocuments({ user: { $in: userIds } })
   ]);

   return { posts, total };
};

const getSuggestedFeedPosts = async (excludedUserIds: string[], skip: number, limit: number) => {
   const query = { user: { $nin: excludedUserIds } };

   const [posts, total] = await Promise.all([
      limit > 0
         ? PostModel.find(query)
            .populate(POST_POPULATE_OPTIONS)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
         : Promise.resolve([]),
      PostModel.countDocuments(query)
   ]);

   return { posts, total };
};



export const getFeedService = async (userId: string, page: number = 1, limit: number = 10) => {
   const cacheKey = `user:feed:${userId}:page:${page}:limit:${limit}`;
   try {
      const cached = await valkey.get(cacheKey);
      if (cached) {
         return JSON.parse(cached);
      }
   } catch (err) {
      console.error("Valkey get feed error:", err);
   }

   const skip = (page - 1) * limit;

   const following = await FollowModel.find({ followerId: userId })
      .select("followingId")
      .lean();

   const followingIds = following.map((item) => item.followingId.toString());
   const prioritizedUserIds = [...new Set([...followingIds, userId])];

   const prioritizedFeed = await getPrioritizedFeedPosts(prioritizedUserIds, skip, limit);
   const remaining = Math.max(limit - prioritizedFeed.posts.length, 0);
   const suggestedSkip = Math.max(skip - prioritizedFeed.total, 0);
   const suggestedFeed = await getSuggestedFeedPosts(prioritizedUserIds, suggestedSkip, remaining);

   let posts = prioritizedFeed.posts;
   let suggestedPosts: typeof prioritizedFeed.posts = suggestedFeed.posts;

   if (remaining > 0) {
      posts = [...posts, ...suggestedPosts];
   }

   const total = prioritizedFeed.total + suggestedFeed.total;

   const result = {
      posts,
      feedBreakdown: {
         prioritizedCount: prioritizedFeed.posts.length,
         suggestedCount: suggestedPosts.length,
         prioritizedTotal: prioritizedFeed.total,
         suggestedTotal: suggestedFeed.total
      },
      pagination: {
         page,
         limit,
         total,
         pages: Math.ceil(total / limit)
      }
   };

   try {
      await valkey.set(cacheKey, JSON.stringify(result), "EX", 300); // 5 minutes TTL
   } catch (err) {
      console.error("Valkey set feed error:", err);
   }

   return result;
};

export const getPostByIdService = async (postId: string) => {
   const post = await PostModel.findById(postId)
      .populate(POST_POPULATE_OPTIONS)
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

   const cloudinaryPublicIds = post.images
      .map((imageUrl) => extractCloudinaryPublicIdFromUrl(imageUrl))
      .filter((publicId): publicId is string => Boolean(publicId));

   if (cloudinaryPublicIds.length > 0) {
      const destroyResults = await Promise.allSettled(
         cloudinaryPublicIds.map((publicId) => cloudinary.uploader.destroy(publicId, { resource_type: "image" }))
      );

      const hasDeleteErrors = destroyResults.some((result) => {
         if (result.status === "rejected") {
            return true;
         }

         const destroyResult = result.value?.result;
         return destroyResult !== "ok" && destroyResult !== "not found";
      });

      if (hasDeleteErrors) {
         throw new InternalServerException("Failed to delete one or more post images from Cloudinary");
      }
   }

   // Delete all comments associated with the post
   await CommentModel.deleteMany({ post: postId });

   await post.deleteOne();

   // Invalidate cache
   await invalidateUserFeedAndFollowers(userId);

   return { message: "Post deleted successfully" };
};

export const likePostService = async (postId: string, userId: string) => {
   const post = await PostModel.findOneAndUpdate(
      { _id: postId, likes: { $ne: userId as any } },
      {
         $push: { likes: userId as any },
         $inc: { likesCount: 1 }
      },
      { new: true }
   );

   if (!post) {
      const exists = await PostModel.exists({ _id: postId });
      if (!exists) throw new NotFoundException("Post not found");
      throw new BadRequestException("You already liked this post");
   }

   await createNotification({
      actorId: userId,
      recipientId: post.user._id.toString(),
      type: "like",
      postId
   })

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
   const post = await PostModel.findOneAndUpdate(
      { _id: postId, likes: userId as any },
      {
         $pull: { likes: userId as any },
         $inc: { likesCount: -1 }
      },
      { new: true }
   );

   if (!post) {
      const exists = await PostModel.exists({ _id: postId });
      if (!exists) throw new NotFoundException("Post not found");
      throw new BadRequestException("You have not liked this post");
   }

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
   const post = await PostModel.findById(postId);

   if (!post) throw new NotFoundException("Post not found");

   const already = await UserSavePostModel.findOne({ userId, postId });
   if (already) {
      throw new BadRequestException("You have already saved this post");
   }
   const savePost = await UserSavePostModel.create({ userId, postId });
   return savePost;
};

export const unsavePostService = async (postId: string, userId: string) => {
   const savedPost = await UserSavePostModel.findOneAndDelete({ userId, postId });

   if (!savedPost) {
      throw new NotFoundException("Saved post not found");
   }

   return { postId, removed: true };
};

export const getSavedPostsService = async (userId: string) => {
   
   const savedPosts = await UserSavePostModel.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
         path: "postId",
         populate: POST_POPULATE_OPTIONS
      })
      .lean();

   const posts = savedPosts
      .map(
         (savedPost) =>
            savedPost.postId as unknown as ({ _id: { toString(): string } } & Record<string, unknown>) | null
      )
      .filter((post): post is NonNullable<typeof post> => Boolean(post));

   const savedPostIds = posts.map((post) => post._id.toString());

   return {
      posts,
      savedPostIds
   };
};
