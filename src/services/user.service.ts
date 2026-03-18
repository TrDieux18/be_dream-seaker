import UserModel from "../models/user.model";
import PostModel from "../models/post.model";
import ChatModel from "../models/chat.model";
import { NotFoundException } from "../utils/app-error";
import FollowModel from "../models/follow.model";

export const findByIdUserService = async (userId: string) => {
   return await UserModel.findById(userId);
};

export const getUsersService = async (userId: string, query?: string) => {


   const searchQuery = query ? {
      $or: [
         { username: { $regex: query, $options: "i" } },
         { name: { $regex: query, $options: "i" } }
      ]
   } : {};

   const users = await UserModel.find({
      ...searchQuery,
      _id: { $ne: userId }
   }).select("-password").limit(20);


   return users;
};

export const getUserProfileService = async (userId: string, currentUserId: string) => {

   const user = await UserModel.findById(userId).select("-password");
   if (!user) {
      throw new NotFoundException("User not found");
   }


   const postsCount = await PostModel.countDocuments({ user: userId });


   const chatsCount = await ChatModel.countDocuments({
      participants: { $in: [userId] }
   });

   const followersCount = await FollowModel.countDocuments({ followingId: userId });
   const followingCount = await FollowModel.countDocuments({ followerId: userId });

   const isOwnProfile = userId === currentUserId.toString();

   // Check if current user is following this profile
   const isFollowing = !isOwnProfile && await FollowModel.exists({
      followerId: currentUserId,
      followingId: userId
   });

   return {
      user,
      stats: {
         posts: postsCount,
         followers: followersCount,
         following: followingCount,
         chats: chatsCount
      },
      isOwnProfile,
      isFollowing: !!isFollowing
   };
};

export const getUserPostsService = async (
   userId: string,
   limit: number = 12,
   offset: number = 0
) => {
   const posts = await PostModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate("user", "name avatar");

   const totalCount = await PostModel.countDocuments({ user: userId });

   return {
      posts,
      totalCount,
      hasMore: offset + posts.length < totalCount
   };
};

export const updateUserProfileService = async (
   userId: string,
   updates: { name?: string; bio?: string; avatar?: string, username?: string }
) => {
   const user = await UserModel.findById(userId);

   if (!user) {
      throw new NotFoundException("User not found");

   }


   if (updates.name) user.name = updates.name;
   if (updates.bio !== undefined) user.bio = updates.bio;
   if (updates.avatar) user.avatar = updates.avatar;
   if (updates.username) user.username = updates.username;

   await user.save();

   const { password, ...userObject } = user.toObject();

   return userObject;
};

export const suggestionUsersService = async (currentUserId: string) => {

   const following = await FollowModel.find({ followerId: currentUserId }).select("followingId");
   const followingIds = following.map(f => f.followingId);
   const suggestions = await UserModel.aggregate([
      { $match: { _id: { $ne: currentUserId, $nin: followingIds } } },
      { $sample: { size: 5 } }
   ]);

   return suggestions;
}