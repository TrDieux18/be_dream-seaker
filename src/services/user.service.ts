import UserModel from "../models/user.model";
import PostModel from "../models/post.model";
import ChatModel from "../models/chat.model";
import { NotFoundException } from "../utils/app-error";

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



   const postsCount = await PostModel.countDocuments({ user: userId });


   const chatsCount = await ChatModel.countDocuments({
      participants: { $in: [userId] }
   });

   const isOwnProfile = userId === currentUserId.toString();
   console.log("isOwnProfile:", isOwnProfile);

   return {
      user,
      stats: {
         posts: postsCount,
         followers: 0,
         following: 0,
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
