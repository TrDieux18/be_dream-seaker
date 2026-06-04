import FollowModel from "../models/follow.model";
import UserModel from "../models/user.model";
import { createNotification } from "./notification.service";
import { valkey } from "../lib/valkey";


export const followUserService = async (currentUserId: string, userIdToFollow: string) => {
   const user = await UserModel.findById(userIdToFollow);

   if (!user) {
      throw new Error("User to follow not found");
   }

   const isAlreadyFollowing = await FollowModel.findOne({
      followerId: currentUserId,
      followingId: userIdToFollow
   });

   if (isAlreadyFollowing) {
      throw new Error("You are already following this user");
   }

   const followDoc = new FollowModel({
      followerId: currentUserId,
      followingId: userIdToFollow
   });

   await followDoc.save();

   await createNotification({
      actorId: currentUserId,
      recipientId: userIdToFollow,
      type: "follow"
   })

   try {
      const feedKeys = await valkey.keys(`user:feed:${currentUserId}:*`);
      const keysToDel = [
         `user:profile:${currentUserId}`,
         `user:profile:${userIdToFollow}`,
         ...feedKeys
      ];
      await valkey.del(keysToDel);
   } catch (err) {
      console.error("Valkey follow cache invalidate error:", err);
   }

   return followDoc;
}

export const unfollowUserService = async (currentUserId: string, userIdToUnfollow: string) => {
   const user = await UserModel.findById(userIdToUnfollow);

   if (!user) {
      throw new Error("User not found");
   }

   const followDoc = await FollowModel.findOneAndDelete({
      followerId: currentUserId,
      followingId: userIdToUnfollow
   });

   if (!followDoc) {
      throw new Error("You are not following this user");
   }

   try {
      const feedKeys = await valkey.keys(`user:feed:${currentUserId}:*`);
      const keysToDel = [
         `user:profile:${currentUserId}`,
         `user:profile:${userIdToUnfollow}`,
         ...feedKeys
      ];
      await valkey.del(keysToDel);
   } catch (err) {
      console.error("Valkey unfollow cache invalidate error:", err);
   }

   return { message: "Unfollowed successfully" };
}

export const checkFollowStatusService = async (currentUserId: string, targetUserId: string) => {
   const isFollowing = await FollowModel.exists({
      followerId: currentUserId,
      followingId: targetUserId
   });

   return { isFollowing: !!isFollowing };
}


export const getFollowerUserService = async (userId: string) => {

   const followers = await FollowModel.find({
      followingId: userId
   }).populate("followerId", "name username avatar");

   return followers;
}

export const getUserFollowingService = async (userId: string) => {

   const followings = await FollowModel.find({
      followerId: userId
   }).populate("followingId", "name username avatar");

   return followings;
}