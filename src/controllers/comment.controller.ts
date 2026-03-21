import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
   deleteCommentService
} from "../services/comment.service";
import { commentIdSchema } from "../validators/comment.validator";

export const deleteCommentController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const { commentId } = commentIdSchema.parse(req.params);

      const result = await deleteCommentService(commentId, userId);

      return res.status(HTTPSTATUS.OK).json(result);
   }
);
