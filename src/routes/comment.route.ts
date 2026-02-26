import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
   getRepliesController,
   deleteCommentController,
   likeCommentController,
   unlikeCommentController
} from "../controllers/comment.controller";

const router = Router();

router.use(passportAuthenticateJwt);

router.get("/:commentId/replies", getRepliesController);
router.delete("/:commentId", deleteCommentController);
router.post("/:commentId/like", likeCommentController);
router.delete("/:commentId/like", unlikeCommentController);

export default router;
