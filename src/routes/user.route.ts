import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
   getUsersController,
   getUserProfileController,
   getUserPostsController,
   updateUserProfileController
} from "../controllers/user.controller";

const userRoutes = Router()
   .use(passportAuthenticateJwt)
   .get("/all", getUsersController)
   .get("/profile/:userId", getUserProfileController)
   .get("/profile/:userId/posts", getUserPostsController)
   .put("/profile", updateUserProfileController)

export default userRoutes;