import FollowModel from "../models/follow.model";
import UserModel from "../models/user.model";


export const followUserService = async (currentUserId: string, userIdToFollow: string) => {
   console.log("Current User ID:", currentUserId);
   console.log("User ID to Follow:", userIdToFollow);

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

   return followDoc;
}