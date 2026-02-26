import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
   createPostService,
   getFeedService,
   getPostByIdService,
   deletePostService,
   likePostService,
   unlikePostService,
   getUserPostsService
} from "../services/post.service";
import { createPostSchema, postIdSchema } from "../validators/post.validator";
import { createCommentService, getCommentsService } from "../services/comment.service";
import { createCommentSchema } from "../validators/comment.validator";

export const createPostController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const body = createPostSchema.parse(req.body);

      const post = await createPostService(userId, body);

      return res.status(HTTPSTATUS.CREATED).json({
         message: "Post created successfully",
         post
      });
   }
);

export const getFeedController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await getFeedService(userId, page, limit);

      return res.status(HTTPSTATUS.OK).json({
         message: "Feed retrieved successfully",
         ...result
      });
   }
);

export const getUserPostsController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId: string = req.user?._id?.toString() || "";
      const rawUserId = req.params.userId;
      const targetUserId: string = (Array.isArray(rawUserId) ? rawUserId[0] : rawUserId) || "";
      const posts = await getUserPostsService(userId, targetUserId);

      return res.status(HTTPSTATUS.OK).json({
         message: "User posts retrieved successfully",
         posts
      });
   }
);

export const getPostByIdController = asyncHandler(
   async (req: Request, res: Response) => {
      const { postId } = postIdSchema.parse(req.params);

      const post = await getPostByIdService(postId);

      return res.status(HTTPSTATUS.OK).json({
         message: "Post retrieved successfully",
         post
      });
   }
);

export const deletePostController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const { postId } = postIdSchema.parse(req.params);

      const result = await deletePostService(postId, userId);

      return res.status(HTTPSTATUS.OK).json(result);
   }
);

export const likePostController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const { postId } = postIdSchema.parse(req.params);

      const post = await likePostService(postId, userId);

      return res.status(HTTPSTATUS.OK).json({
         message: "Post liked successfully",
         post
      });
   }
);

export const unlikePostController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const { postId } = postIdSchema.parse(req.params);

      const post = await unlikePostService(postId, userId);

      return res.status(HTTPSTATUS.OK).json({
         message: "Post unliked successfully",
         post
      });
   }
);

export const createCommentController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id?.toString() || "";
      const { postId } = postIdSchema.parse(req.params);
      const body = createCommentSchema.parse(req.body);

      const comment = await createCommentService(postId, userId, body);

      return res.status(HTTPSTATUS.CREATED).json({
         message: "Comment created successfully",
         comment
      });
   }
);

export const getCommentsController = asyncHandler(
   async (req: Request, res: Response) => {
      const { postId } = postIdSchema.parse(req.params);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await getCommentsService(postId, page, limit);

      return res.status(HTTPSTATUS.OK).json({
         message: "Comments retrieved successfully",
         ...result
      });
   }
);
