import { emitNewChatToParticpants } from "../lib/socket";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import UserModel from "../models/user.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";

export const createChatService = async (
  userId: string,
  body: {
    participantId?: string;
    isGroup?: boolean;
    participants?: string[];
    groupName?: string;
  }
) => {
  const { participantId, isGroup, participants, groupName } = body;

  let chat;
  let allParticipantIds: string[] = [];

  if (isGroup && participants?.length && groupName) {
    allParticipantIds = [userId, ...participants];
    chat = await ChatModel.create({
      participants: allParticipantIds,
      isGroup: true,
      groupName,
      createdBy: userId,
    });
  } else if (participantId) {
    const otherUser = await UserModel.findById(participantId);
    if (!otherUser) throw new NotFoundException("User not found");

    allParticipantIds = [userId, participantId];
    const existingChat = await ChatModel.findOne({
      participants: {
        $all: allParticipantIds,
        $size: 2,
      },
    }).populate("participants", "name avatar");

    if (existingChat) return existingChat;

    chat = await ChatModel.create({
      participants: allParticipantIds,
      isGroup: false,
      createdBy: userId,
    });
  }

  // Implement websocket
  const populatedChat = await chat?.populate(
    "participants",
    "name avatar isAI"
  );
  const particpantIdStrings = populatedChat?.participants?.map((p) => {
    return p._id?.toString();
  });

  emitNewChatToParticpants(particpantIdStrings, populatedChat);

  return chat;
};

export const getUserChatsService = async (
  userId: string,
  limit: number = 20,
  offset: number = 0
) => {
  const chats = await ChatModel.find({
    participants: {
      $in: [userId],
    },
  })
    .populate("participants", "name avatar")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .sort({ updatedAt: -1 })
    .skip(offset)
    .limit(limit);

  // Get total count for hasMore calculation
  const totalCount = await ChatModel.countDocuments({
    participants: {
      $in: [userId],
    },
  });

  return { chats, totalCount, hasMore: offset + chats.length < totalCount };
};

export const getSingleChatService = async (chatId: string, userId: string) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  }).populate("participants", "name avatar");

  if (!chat)
    throw new BadRequestException(
      "Chat not found or you are not authorized to view this chat"
    );

  const messages = await MessageModel.find({ chatId })
    .populate("sender", "name avatar")
    .populate({
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .sort({ createdAt: 1 });

  return {
    chat,
    messages,
  };
};

export const validateChatParticipant = async (
  chatId: string,
  userId: string
) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  });
  if (!chat) throw new BadRequestException("User not a participant in chat");
  return chat;
};

export const updateGroupImageService = async (
  chatId: string,
  userId: string,
  imageUrl: string
) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: { $in: [userId] },
    isGroup: true,
  });

  if (!chat) {
    throw new BadRequestException(
      "Chat not found or you are not authorized to update this group"
    );
  }

  chat.groupImage = imageUrl;
  await chat.save();

  const updatedChat = await chat.populate("participants", "name avatar");

  return updatedChat;
};

export const updateGroupNameService = async (
  chatId: string,
  userId: string,
  groupName: string
) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: { $in: [userId] },
    isGroup: true,
  });

  if (!chat) {
    throw new BadRequestException(
      "Chat not found or you are not authorized to update this group"
    );
  }

  chat.groupName = groupName;
  await chat.save();

  const updatedChat = await chat.populate("participants", "name avatar");

  return updatedChat;
};

export const deleteGroupImageService = async (
  chatId: string,
  userId: string
) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: { $in: [userId] },
    isGroup: true,
  });

  if (!chat) {
    throw new BadRequestException(
      "Chat not found or you are not authorized to update this group"
    );
  }

  chat.groupImage = "";
  await chat.save();

  const updatedChat = await chat.populate("participants", "name avatar");

  return updatedChat;
};

export const deleteGroupNameService = async (
  chatId: string,
  userId: string
) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: { $in: [userId] },
    isGroup: true,
  });

  if (!chat) {
    throw new BadRequestException(
      "Chat not found or you are not authorized to update this group"
    );
  }

  chat.groupName = "";
  await chat.save();

  const updatedChat = await chat.populate("participants", "name avatar");

  return updatedChat;
};

export const deleteChatService = async (chatId: string, userId: string) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: { $in: [userId] },
  });

  if (!chat) {
    throw new BadRequestException(
      "Chat not found or you are not authorized to delete this chat"
    );
  }

  // Delete all messages in the chat
  await MessageModel.deleteMany({ chatId });

  // Delete the chat
  await ChatModel.findByIdAndDelete(chatId);

  return { chatId, participants: chat.participants };
};
