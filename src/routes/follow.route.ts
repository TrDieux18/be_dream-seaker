import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import { followUserController } from "../controllers/follow.controller";

const followRouter = Router()
   .use(passportAuthenticateJwt)
   .post("/:userIdToFollow", followUserController)




export default followRouter;