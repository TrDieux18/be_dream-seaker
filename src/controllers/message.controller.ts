import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { messageIdSchema, sendMessageSchema } from "../validators/message.validator";
import { HTTPSTATUS } from "../config/http.config";
import { clearChatMessagesService, deleteMessageService, sendMessageService } from "../services/message.service";
import { emitLastMessageToParticipants, emitMessageDeletedToChatRoom, emitMessagesCleared } from "../lib/socket";
import ChatModel from "../models/chat.model";
import { chatIdBodySchema } from "../validators/chat.validator";


export const sendMessageController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;

      const body = sendMessageSchema.parse(req.body);

      const result = await sendMessageService(userId, body);

      return res.status(HTTPSTATUS.OK).json({
         message: "Message sent successfully",
         ...result
      })
   }
)

export const deleteMessageController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;
      const { id } = messageIdSchema.parse(req.params);

      const result = await deleteMessageService(id, userId as string);

      // Emit socket event to chat room
      emitMessageDeletedToChatRoom(result.chatId, result.messageId);

      // If last message was updated, emit to participants
      if (result.wasLastMessageDeleted) {
         const chat = await ChatModel.findById(result.chatId);
         if (chat) {
            const participantIds = chat.participants.map((p) => p.toString());
            emitLastMessageToParticipants(
               participantIds,
               result.chatId,
               result.newLastMessage ?? null
            );
         }
      }

      return res.status(HTTPSTATUS.OK).json({
         message: "Message deleted successfully",
         messageId: result.messageId,
         newLastMessage: result.newLastMessage ?? null,
         wasLastMessageDeleted: result.wasLastMessageDeleted
      })
   }
)

export const clearChatMessagesController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;
      const body = chatIdBodySchema.parse(req.body);

      const result = await clearChatMessagesService(body.chatId, userId as string);

      // Emit socket event to chat room
      emitMessagesCleared(result.chatId);

      // Update last message for participants
      const chat = await ChatModel.findById(result.chatId);
      if (chat) {
         const participantIds = chat.participants.map((p) => p.toString());
         emitLastMessageToParticipants(participantIds, result.chatId, null);
      }

      return res.status(HTTPSTATUS.OK).json({
         message: "Chat messages cleared successfully",
         chatId: result.chatId
      })
   }
)