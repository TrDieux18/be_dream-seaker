import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
   deleteCommentController
} from "../controllers/comment.controller";

const commentRouter = Router()
   .use(passportAuthenticateJwt)
   .delete("/:commentId", deleteCommentController);

export default commentRouter;
