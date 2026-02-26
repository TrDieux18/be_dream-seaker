import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { getUsersService, getUserProfileService, getUserPostsService, updateUserProfileService } from "../services/user.service";
import { userIdParamSchema, updateProfileSchema, paginationQuerySchema } from "../validators/user.validator";
import cloudinary from "../config/cloudinary.config";

export const getUsersController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;

      const users = await getUsersService(userId as string);

      return res.status(HTTPSTATUS.OK).json({
         message: "Users retrieved successfully",
         users
      });
   })

export const getUserProfileController = asyncHandler(
   async (req: Request, res: Response) => {
      const currentUserId = req.user?._id;
      const { userId } = userIdParamSchema.parse(req.params);

      const profileData = await getUserProfileService(userId, currentUserId as string);

      return res.status(HTTPSTATUS.OK).json({
         message: "Profile retrieved successfully",
         ...profileData
      });
   }
);

export const getUserPostsController = asyncHandler(
   async (req: Request, res: Response) => {
      const { userId } = userIdParamSchema.parse(req.params);
      const { limit, offset } = paginationQuerySchema.parse(req.query);

      const result = await getUserPostsService(userId, limit, offset);

      return res.status(HTTPSTATUS.OK).json({
         message: "User posts retrieved successfully",
         ...result
      });
   }
);

export const updateUserProfileController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;
      const body = updateProfileSchema.parse(req.body);

      // Handle avatar upload if provided
      if (body.avatar && body.avatar.startsWith('data:image')) {
         try {
            const uploadRes = await cloudinary.uploader.upload(body.avatar, {
               folder: "user-avatars",
               resource_type: "image",
               transformation: [
                  { width: 400, height: 400, crop: "fill", gravity: "face" },
                  { quality: "auto" }
               ]
            });
            body.avatar = uploadRes.secure_url;
         } catch (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
               message: "Failed to upload avatar. Please try again."
            });
         }
      }

      const updatedUser = await updateUserProfileService(userId as string, body);

      return res.status(HTTPSTATUS.OK).json({
         message: "Profile updated successfully",
         user: updatedUser
      });
   }
);