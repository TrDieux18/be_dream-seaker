import PostModel from "../models/post.model";
import CommentModel from "../models/comment.model";
import FollowModel from "../models/follow.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import { getSocketIO } from "../lib/socket";
import UserSavePostModel from "../models/user-save-post.model";

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
   const post = await PostModel.create({
      user: userId,
      caption: body.caption || "",
      images: body.images,
      location: body.location || ""
   });

   const populatedPost = await post.populate("user", "name avatar");
   return populatedPost;
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

   return {
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
};

export const getUserPostsService = async (userId: string, targetUserId: string) => {
   const posts = await PostModel.find({ user: targetUserId })
      .populate(POST_POPULATE_OPTIONS)
      .sort({ createdAt: -1 })
      .lean();

   return posts;
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
