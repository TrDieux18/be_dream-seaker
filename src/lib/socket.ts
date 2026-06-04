import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { Env } from "../config/env.config";
import { validateChatParticipant } from "../services/chat.service";
import { valkey } from "./valkey";

interface AuthenticatedSocket extends Socket {
   userId?: string;
}

let io: Server | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
   io = new Server(httpServer, {
      cors: {
         origin: Env.FRONTEND_ORIGIN ? Env.FRONTEND_ORIGIN.split(",") : [],
         methods: ["GET", "POST"],
         credentials: true,
      },
   });

   io.use(async (socket: AuthenticatedSocket, next) => {
      try {
         const rawCookie = socket.handshake.headers.cookie;

         if (!rawCookie) {
            return next(new Error("Unauthorized"));
         }

         // Parse cookie properly
         const cookies: { [key: string]: string } = {};
         rawCookie.split(';').forEach(cookie => {
            const [name, ...rest] = cookie.trim().split('=');
            cookies[name] = rest.join('=');
         });

         const token = cookies.accessToken;

         if (!token) {
            return next(new Error("Unauthorized"));
         }

         const decodedToken = jwt.verify(token, Env.JWT_SECRET) as {
            userId: string;
         };
         if (!decodedToken) {
            return next(new Error("Unauthorized"));
         }

         socket.userId = decodedToken.userId;
         next();
      } catch (error) {
         console.error("Socket authentication error:", error);
         next(new Error("Internal server error"));
      }
   });

   io.on("connection", async (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      const newSocketId = socket.id;
      if (!socket.userId) {
         socket.disconnect(true);
         return;
      }

      // register socket for the user in Valkey Hash
      try {
         await valkey.hset("online:users", userId, newSocketId);

         // BroadCast online users to all socket
         const keys = await valkey.hkeys("online:users");
         io?.emit("online:users", keys);
      } catch (err) {
         console.error("Valkey online user set error:", err);
      }

      // create personnal room for user
      socket.join(`user:${userId}`);

      socket.on(
         "chat:join",
         async (chatId: string, callback?: (err?: string) => void) => {
            try {
               await validateChatParticipant(chatId, userId);
               socket.join(`chat:${chatId}`);
               callback?.();
            } catch (error) {
               callback?.("Error joining chat");
            }
         }
      );

      socket.on("chat:leave", (chatId: string) => {
         if (chatId) {
            socket.leave(`chat:${chatId}`);
         }
      });

      socket.on("disconnect", async () => {
         try {
            const currentSocketId = await valkey.hget("online:users", userId);
            if (currentSocketId === newSocketId) {
               if (userId) {
                  await valkey.hdel("online:users", userId);
               }
               const keys = await valkey.hkeys("online:users");
               io?.emit("online:users", keys);
            }
         } catch (err) {
            console.error("Valkey online user disconnect error:", err);
         }
      });
   });
};

function getIO() {
   if (!io) throw new Error("Socket.IO not initialized");
   return io;
}

export const getSocketIO = () => {
   return io;
};

export const emitNewChatToParticpants = (
   participantIds: string[] = [],
   chat: any
) => {
   const io = getIO();
   for (const participantId of participantIds) {
      io.to(`user:${participantId}`).emit("chat:new", chat);
   }
};

export const emitNewMessageToChatRoom = async (
   senderId: string,
   chatId: string,
   message: any
) => {
   const io = getIO();
   let senderSocketId: string | null = null;
   try {
      senderSocketId = await valkey.hget("online:users", senderId?.toString());
   } catch (err) {
      console.error("Valkey get sender socket error:", err);
   }

   if (senderSocketId) {
      io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
   } else {
      io.to(`chat:${chatId}`).emit("message:new", message);
   }
};

export const emitLastMessageToParticipants = (
   participantIds: string[],
   chatId: string,
   lastMessage: any
) => {
   const io = getIO();
   const payload = { chatId, lastMessage };

   for (const participantId of participantIds) {
      io.to(`user:${participantId}`).emit("chat:update", payload);
   }
};

export const emitGroupUpdatedToParticipants = (
   participantIds: string[],
   chat: any
) => {
   const io = getIO();
   for (const participantId of participantIds) {
      io.to(`user:${participantId}`).emit("chat:group-updated", chat);
   }
};

export const emitMessageDeletedToChatRoom = (
   chatId: string,
   messageId: string
) => {
   const io = getIO();
   io.to(`chat:${chatId}`).emit("message:deleted", { messageId, chatId });
};

export const emitMessagesCleared = (chatId: string) => {
   const io = getIO();
   io.to(`chat:${chatId}`).emit("chat:messages-cleared", { chatId });
};

export const emitChatDeletedToParticipants = (
   participantIds: string[],
   chatId: string
) => {
   const io = getIO();
   for (const participantId of participantIds) {
      io.to(`user:${participantId}`).emit("chat:deleted", { chatId });
   }
};
