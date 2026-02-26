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
router.use(passportAuthenticateJwt);

// Post routes
router.post("/create", createPostController);
router.get("/feed", getFeedController);
router.get("/user/:userId", getUserPostsController);
router.get("/:postId", getPostByIdController);
router.delete("/:postId", deletePostController);

// Like routes
router.post("/:postId/like", likePostController);
router.delete("/:postId/like", unlikePostController);

// Comment routes
router.post("/:postId/comment", createCommentController);
router.get("/:postId/comments", getCommentsController);

export default router;
