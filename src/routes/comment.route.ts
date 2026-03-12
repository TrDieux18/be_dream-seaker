import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
   deleteCommentController,
   likeCommentController,
   unlikeCommentController
} from "../controllers/comment.controller";

const commentRouter = Router()
   .use(passportAuthenticateJwt)
   .delete("/:commentId", deleteCommentController)
   .post("/:commentId/like", likeCommentController)
   .delete("/:commentId/like", unlikeCommentController);

export default commentRouter;
