import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import { followUserController, unfollowUserController, checkFollowStatusController, getFollowerUserController, getUserFollowingController } from "../controllers/follow.controller";

const followRouter = Router()
   .use(passportAuthenticateJwt)
   .post("/:userIdToFollow", followUserController)
   .delete("/:userIdToFollow", unfollowUserController)
   .get("/status/:userIdToFollow", checkFollowStatusController)
   .get("/followers/:userIdToFollow", getFollowerUserController)
   .get("/following/:userIdToFollow", getUserFollowingController)




export default followRouter;