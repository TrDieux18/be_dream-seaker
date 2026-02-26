import UserModel from "../models/user.model";
import PostModel from "../models/post.model";
import ChatModel from "../models/chat.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";

export const findByIdUserService = async (userId: string) => {
   return await UserModel.findById(userId);
};

export const getUsersService = async (userId: string) => {
   const users = await UserModel.find({ _id: { $ne: userId } }).select(
      "-password"
   );

   return users;
};

export const getUserProfileService = async (userId: string, currentUserId: string) => {
   const user = await UserModel.findById(userId).select("-password");

   if (!user) {
      throw new NotFoundException("User not found");
   }

   // Get user statistics
   const postsCount = await PostModel.countDocuments({ user: userId });

   // For followers/following, we can use chat participants as a proxy
   // In a full implementation, you'd have a separate Follow model
   const chatsCount = await ChatModel.countDocuments({
      participants: { $in: [userId] }
   });

   const isOwnProfile = userId === currentUserId;

   return {
      user,
      stats: {
         posts: postsCount,
         followers: 0, // Placeholder - implement follow system later
         following: 0, // Placeholder - implement follow system later
         chats: chatsCount
      },
      isOwnProfile
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
   updates: { name?: string; bio?: string; avatar?: string }
) => {
   const user = await UserModel.findById(userId);

   if (!user) {
      throw new NotFoundException("User not found");
   }

   if (updates.name) user.name = updates.name;
   if (updates.bio !== undefined) user.bio = updates.bio;
   if (updates.avatar) user.avatar = updates.avatar;

   await user.save();

   const { password, ...userObject } = user.toObject();

   return userObject;
};
