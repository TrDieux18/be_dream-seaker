import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { chatIdBodySchema, chatIdSchema, createChatSchema, paginationQuerySchema, updateGroupImageSchema, updateGroupNameSchema } from "../validators/chat.validator";
import { HTTPSTATUS } from "../config/http.config";
import { createChatService, deleteChatService, deleteGroupImageService, deleteGroupNameService, getSingleChatService, getUserChatsService, updateGroupImageService, updateGroupNameService } from "../services/chat.service";
import cloudinary from "../config/cloudinary.config";
import { emitChatDeletedToParticipants, emitGroupUpdatedToParticipants } from "../lib/socket";

export const createChatController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;

      const body = createChatSchema.parse(req.body);

      const chat = await createChatService(
         userId,
         body
      );
      return res.status(HTTPSTATUS.OK).json({
         message: "Chat created successfully",
         chat
      })
   }
)

export const getUserChatsController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;
      const { limit, offset } = paginationQuerySchema.parse(req.query);

      console.log("📋 getUserChats - userId:", userId, "limit:", limit, "offset:", offset);

      const { chats, totalCount, hasMore } = await getUserChatsService(userId, limit, offset);

      console.log("📋 getUserChats - chats found:", chats.length, "totalCount:", totalCount, "hasMore:", hasMore);

      return res.status(HTTPSTATUS.OK).json({
         message: "User chats retrieved successfully",
         chats,
         totalCount,
         hasMore
      })
   }
);


export const getSingleChatController = asyncHandler(
   async (req: Request, res: Response) => {

      const userId = req.user?._id;
      const { id } = chatIdSchema.parse(req.params);

      const { chat, messages } = await getSingleChatService(id, userId as string);

      return res.status(HTTPSTATUS.OK).json({
         message: "User chats retrieved successfully",
         chat,
         messages
      })

   }
)

export const updateGroupImageController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;
      const body = updateGroupImageSchema.parse(req.body);

      if (!body.image) {
         return res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: "Image data is required"
         });
      }

      let imageUrl;
      try {
         // Upload to Cloudinary with optimization
         const uploadRes = await cloudinary.uploader.upload(body.image, {
            folder: "chat-groups",
            resource_type: "image",
            transformation: [
               { width: 500, height: 500, crop: "limit" },
               { quality: "auto" }
            ]
         });
         imageUrl = uploadRes.secure_url;
      } catch (error) {
         console.error("Cloudinary upload error:", error);
         return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: "Failed to upload image. Please try again."
         });
      }

      const updatedChat = await updateGroupImageService(body.chatId, userId as string, imageUrl);

      // Emit socket event to all participants
      const participantIds = updatedChat.participants.map((p) => p._id?.toString());
      emitGroupUpdatedToParticipants(participantIds, updatedChat);

      return res.status(HTTPSTATUS.OK).json({
         message: "Group image updated successfully",
         chat: updatedChat
      })
   }
)

export const updateGroupNameController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;
      const body = updateGroupNameSchema.parse(req.body);

      const updatedChat = await updateGroupNameService(body.chatId, userId as string, body.groupName);

      // Emit socket event to all participants
      const participantIds = updatedChat.participants.map((p) => p._id?.toString());
      emitGroupUpdatedToParticipants(participantIds, updatedChat);

      return res.status(HTTPSTATUS.OK).json({
         message: "Group name updated successfully",
         chat: updatedChat
      })
   }
)

export const deleteGroupImageController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;
      const body = chatIdBodySchema.parse(req.body);

      const updatedChat = await deleteGroupImageService(body.chatId, userId as string);

      // Emit socket event to all participants
      const participantIds = updatedChat.participants.map((p) => p._id?.toString());
      emitGroupUpdatedToParticipants(participantIds, updatedChat);

      return res.status(HTTPSTATUS.OK).json({
         message: "Group image deleted successfully",
         chat: updatedChat
      })
   }
)

export const deleteGroupNameController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;
      const body = chatIdBodySchema.parse(req.body);

      const updatedChat = await deleteGroupNameService(body.chatId, userId as string);

      // Emit socket event to all participants
      const participantIds = updatedChat.participants.map((p) => p._id?.toString());
      emitGroupUpdatedToParticipants(participantIds, updatedChat);

      return res.status(HTTPSTATUS.OK).json({
         message: "Group name deleted successfully",
         chat: updatedChat
      })
   }
)

export const deleteChatController = asyncHandler(
   async (req: Request, res: Response) => {
      const userId = req.user?._id;
      const body = chatIdBodySchema.parse(req.body);

      const result = await deleteChatService(body.chatId, userId as string);

      // Emit socket event to all participants
      const participantIds = result.participants.map((p) => p.toString());
      emitChatDeletedToParticipants(participantIds, result.chatId);

      return res.status(HTTPSTATUS.OK).json({
         message: "Chat deleted successfully",
         chatId: result.chatId
      })
   }
)