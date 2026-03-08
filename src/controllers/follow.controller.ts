import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { followUserIdSchema } from "../validators/follow.validator";
import { followUserService } from "../services/follow.service";
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