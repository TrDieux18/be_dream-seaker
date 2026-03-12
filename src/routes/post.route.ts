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
   getUserPostsController,
   savePostController,
   unsavePostController,
   getSavedPostsController
} from "../controllers/post.controller";

const postRouter = Router()
   .use(passportAuthenticateJwt)
   .post("/create", createPostController)
   .get("/feed", getFeedController)
   .get("/saved", getSavedPostsController)
   .get("/user/:userId", getUserPostsController)
   .get("/:postId", getPostByIdController)
   .delete("/:postId", deletePostController)
   .post("/:postId/like", likePostController)
   .delete("/:postId/like", unlikePostController)
   .post("/:postId/save", savePostController)
   .delete("/:postId/save", unsavePostController)
   .post("/:postId/comment", createCommentController)
   .get("/:postId/comments", getCommentsController)

export default postRouter;
