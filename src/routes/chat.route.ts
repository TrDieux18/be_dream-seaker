import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import { createChatController, deleteChatController, deleteGroupImageController, deleteGroupNameController, getSingleChatController, getUserChatsController, updateGroupImageController, updateGroupNameController } from "../controllers/chat.controller";
import { clearChatMessagesController, deleteMessageController, editMessageController, sendMessageController } from "../controllers/message.controller";

const chatRoutes = Router()
   .use(passportAuthenticateJwt)
   .post("/create", createChatController)
   .post("/message/send", sendMessageController)
   .get("/all", getUserChatsController)
   .get("/:id", getSingleChatController)
   .put("/group/image", updateGroupImageController)
   .put("/group/name", updateGroupNameController)
   .delete("/group/image", deleteGroupImageController)
   .delete("/group/name", deleteGroupNameController)
   .delete("/delete", deleteChatController)
   .delete("/message/:id", deleteMessageController)
   .delete("/messages/clear", clearChatMessagesController)
   .put("/message/edit", editMessageController);

export default chatRoutes;