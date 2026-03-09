import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import { followUserController, unfollowUserController, checkFollowStatusController } from "../controllers/follow.controller";

const followRouter = Router()
   .use(passportAuthenticateJwt)
   .post("/:userIdToFollow", followUserController)
   .delete("/:userIdToFollow", unfollowUserController)
   .get("/status/:userIdToFollow", checkFollowStatusController)




export default followRouter;