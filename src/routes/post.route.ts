import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
   createPostController,
   getFeedController,
   getPostByIdController,
   deletePostController,
   likePostController,
   unlikePostController,
   createCommentController,
   getCommentsController,
   getUserPostsController
} from "../controllers/post.controller";

const router = Router();

// Apply authentication middleware to all routes
router.use(passportAuthenticateJwt)
   .post("/create", createPostController)
   .get("/feed", getFeedController)
   .get("/user/:userId", getUserPostsController)
   .get("/:postId", getPostByIdController)
   .delete("/:postId", deletePostController)
   .post("/:postId/like", likePostController)
   .delete("/:postId/like", unlikePostController)
   .post("/:postId/comment", createCommentController)
   .get("/:postId/comments", getCommentsController)

export default router;
