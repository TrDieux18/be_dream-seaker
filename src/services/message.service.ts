import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.config";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import {
  emitLastMessageToParticipants,
  emitNewMessageToChatRoom,
} from "../lib/socket";
import UserModel from "../models/user.model";

export const sendMessageService = async (
  userId: string,
  body: {
    chatId: string;
    content?: string;
    image?: string;
    replyToId?: string;
  }
) => {
  const { chatId, content, image, replyToId } = body;

  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  });
  if (!chat) throw new BadRequestException("Chat not found or unauthorized");

  if (replyToId) {
    const replyMessage = await MessageModel.findOne({
      _id: replyToId,
      chatId,
    });
    if (!replyMessage) throw new NotFoundException("Reply message not found");
  }

  let imageUrl;

  if (image) {
    //upload the image to cloudinary
    const uploadRes = await cloudinary.uploader.upload(image);
    imageUrl = uploadRes.secure_url;
  }

  const newMessage = await MessageModel.create({
    chatId,
    sender: userId,
    content,
    image: imageUrl,
    replyTo: replyToId || null,
  });

  await newMessage.populate([
    { path: "sender", select: "name avatar" },
    {
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    },
  ]);

  chat.lastMessage = newMessage._id as mongoose.Types.ObjectId;
  await chat.save();

  //websocket emit the new Message to the chat room
  emitNewMessageToChatRoom(userId, chatId, newMessage);

  //websocket emit the lastmessage to members (personnal room user)
  const allParticipantIds = chat.participants.map((id) => id.toString());
  emitLastMessageToParticipants(allParticipantIds, chatId, newMessage);

  return {
    userMessage: newMessage,
    chat,
  };
};

export const deleteMessageService = async (
  messageId: string,
  userId: string
) => {
  const message = await MessageModel.findById(messageId);

  if (!message) {
    throw new NotFoundException("Message not found");
  }

  // Check if user is the sender or a participant in the chat
  const chat = await ChatModel.findOne({
    _id: message.chatId,
    participants: { $in: [userId] },
  });

  if (!chat) {
    throw new BadRequestException(
      "You are not authorized to delete this message"
    );
  }

  await MessageModel.findByIdAndDelete(messageId);

  // Update last message if the deleted message was the last one
  if (chat.lastMessage?.toString() === messageId) {
    const newLastMessage = await MessageModel.findOne({
      chatId: message.chatId,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name avatar");

    chat.lastMessage = newLastMessage?._id || null;
    await chat.save();

    return { messageId, chatId: message.chatId.toString(), newLastMessage };
  }

  return { messageId, chatId: message.chatId.toString(), newLastMessage: null };
};

export const clearChatMessagesService = async (
  chatId: string,
  userId: string
) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: { $in: [userId] },
  });

  if (!chat) {
    throw new BadRequestException(
      "Chat not found or you are not authorized to clear this chat"
    );
  }

  await MessageModel.deleteMany({ chatId });

  chat.lastMessage = null;
  await chat.save();

  return { chatId };
};

export const editMessageService = async (
  messageId: string,
  userId: string,
  newContent: string
) => {
  const message = await MessageModel.findById(messageId);

  if (!message) {
    throw new NotFoundException("Message not found");
  }

  // Only the sender can edit the message
  if (message.sender.toString() !== userId) {
    throw new BadRequestException("You can only edit your own messages");
  }

  // Check if user is still a participant in the chat
  const chat = await ChatModel.findOne({
    _id: message.chatId,
    participants: { $in: [userId] },
  });

  if (!chat) {
    throw new BadRequestException("You are not authorized to edit this message");
  }

  // Cannot edit messages with images (for now)
  if (message.image) {
    throw new BadRequestException("Cannot edit messages with images");
  }

  message.content = newContent;
  await message.save();

  const updatedMessage = await MessageModel.findById(messageId)
    .populate("sender", "name avatar")
    .populate({
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    });

  return { message: updatedMessage, chatId: message.chatId.toString() };
};
