import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { followUserIdSchema } from "../validators/follow.validator";
import { followUserService, unfollowUserService, checkFollowStatusService } from "../services/follow.service";
import { HTTPSTATUS } from "../config/http.config";


export const followUserController = asyncHandler(
   async (req: Request, res: Response) => {
      const currentUserId = req.user?._id;

      const { userIdToFollow } = followUserIdSchema.parse(req.params);

      const result = await followUserService(currentUserId, userIdToFollow);

      return res.status(HTTPSTATUS.OK).json({
         message: "Follow request processed",
         result
      });

   }
)

export const unfollowUserController = asyncHandler(
   async (req: Request, res: Response) => {
      const currentUserId = req.user?._id;

      const { userIdToFollow } = followUserIdSchema.parse(req.params);

      const result = await unfollowUserService(currentUserId, userIdToFollow);

      return res.status(HTTPSTATUS.OK).json(result);
   }
)

export const checkFollowStatusController = asyncHandler(
   async (req: Request, res: Response) => {
      const currentUserId = req.user?._id;

      const { userIdToFollow } = followUserIdSchema.parse(req.params);

      const result = await checkFollowStatusService(currentUserId, userIdToFollow);

      return res.status(HTTPSTATUS.OK).json(result);
   }
)