import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
   getNotificationsController,
   getUnreadCountController,
   markAllNotificationsAsReadController,
   markNotificationAsReadController
} from "../controllers/notification.controller";


const notificationRouter = Router()
   .use(passportAuthenticateJwt)
   .get("/unread-count", getUnreadCountController)
   .patch("/read-all", markAllNotificationsAsReadController)
   .patch("/:notificationId/read", markNotificationAsReadController)
   .get("/", getNotificationsController)


export default notificationRouter;