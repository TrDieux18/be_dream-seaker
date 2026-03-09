import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
   getUsersController,
   getUserProfileController,
   getUserPostsController,
   updateUserProfileController,
   searchUsersController,
   suggestionUsersController
} from "../controllers/user.controller";

const userRoutes = Router()
   .use(passportAuthenticateJwt)
   .get("/all", getUsersController)
   .get("/search", searchUsersController)
   .get("/profile/:userId", getUserProfileController)
   .get("/profile/:userId/posts", getUserPostsController)
   .put("/profile", updateUserProfileController)
   .get("/suggest", suggestionUsersController)

export default userRoutes;