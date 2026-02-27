import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
   getRepliesController,
   deleteCommentController,
   likeCommentController,
   unlikeCommentController
} from "../controllers/comment.controller";

const router = Router();

router.use(passportAuthenticateJwt)
   .get("/:commentId/replies", getRepliesController)
   .delete("/:commentId", deleteCommentController)
   .post("/:commentId/like", likeCommentController)
   .delete("/:commentId/like", unlikeCommentController);

export default router;
