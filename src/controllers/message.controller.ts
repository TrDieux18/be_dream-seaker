import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { editMessageSchema, messageIdSchema, sendMessageSchema } from "../validators/message.validator";
import { HTTPSTATUS } from "../config/http.config";
import { clearChatMessagesService, deleteMessageService, editMessageService, sendMessageService } from "../services/message.service";
import { emitLastMessageToParticipants, emitMessageDeletedToChatRoom, emitMessageEditedToChatRoom, emitMessagesCleared } from "../lib/socket";
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
      if (result.newLastMessage !== undefined) {
         const chat = await ChatModel.findById(result.chatId);
         if (chat) {
            const participantIds = chat.participants.map((p) => p.toString());
            emitLastMessageToParticipants(participantIds, result.chatId, result.newLastMessage);
         }
      }

      return res.status(HTTPSTATUS.OK).json({
         message: "Message deleted successfully",
         messageId: result.messageId
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

export const editMessageController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;
      const body = editMessageSchema.parse(req.body);

      const result = await editMessageService(body.messageId, userId as string, body.content);

      // Emit socket event to chat room
      emitMessageEditedToChatRoom(result.chatId, result.message);

      return res.status(HTTPSTATUS.OK).json({
         message: "Message edited successfully",
         editedMessage: result.message
      })
   }
)