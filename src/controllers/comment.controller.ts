import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
   deleteCommentService,
   getRepliesService,
   likeCommentService,
   unlikeCommentService
} from "../services/comment.service";
import { commentIdSchema } from "../validators/comment.validator";

export const getRepliesController = asyncHandler(
   async (req: Request, res: Response) => {
      const { commentId } = commentIdSchema.parse(req.params);

      const replies = await getRepliesService(commentId);

      return res.status(HTTPSTATUS.OK).json({
         message: "Replies retrieved successfully",
         replies
      });
   }
);

export const deleteCommentController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const { commentId } = commentIdSchema.parse(req.params);

      const result = await deleteCommentService(commentId, userId);

      return res.status(HTTPSTATUS.OK).json(result);
   }
);

export const likeCommentController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const { commentId } = commentIdSchema.parse(req.params);

      const comment = await likeCommentService(commentId, userId);

      return res.status(HTTPSTATUS.OK).json({
         message: "Comment liked successfully",
         comment
      });
   }
);

export const unlikeCommentController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const { commentId } = commentIdSchema.parse(req.params);

      const comment = await unlikeCommentService(commentId, userId);

      return res.status(HTTPSTATUS.OK).json({
         message: "Comment unliked successfully",
         comment
      });
   }
);
