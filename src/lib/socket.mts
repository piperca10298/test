import type { Server as HttpServer } from "node:http";

import { Server as SocketIOServer } from "socket.io";

const globalForSocket = globalThis as unknown as {
  io?: SocketIOServer;
  activeUsers?: Map<string, Set<string>>;
  socketToUser?: Map<string, string>;
  typingUsers?: Map<string, Set<string>>;
  socketToTypingConversations?: Map<string, Set<string>>;
};

function getSocketState() {
  if (!globalForSocket.activeUsers) {
    globalForSocket.activeUsers = new Map();
  }

  if (!globalForSocket.socketToUser) {
    globalForSocket.socketToUser = new Map();
  }

  if (!globalForSocket.typingUsers) {
    globalForSocket.typingUsers = new Map();
  }

  if (!globalForSocket.socketToTypingConversations) {
    globalForSocket.socketToTypingConversations = new Map();
  }

  return {
    activeUsers: globalForSocket.activeUsers,
    socketToUser: globalForSocket.socketToUser,
    typingUsers: globalForSocket.typingUsers,
    socketToTypingConversations: globalForSocket.socketToTypingConversations,
  };
}

function removeSocketFromUser(
  activeUsers: Map<string, Set<string>>,
  socketToUser: Map<string, string>,
  userId: string,
  socketId: string,
) {
  const userSockets = activeUsers.get(userId);

  socketToUser.delete(socketId);

  if (!userSockets) {
    return false;
  }

  userSockets.delete(socketId);

  if (userSockets.size === 0) {
    activeUsers.delete(userId);
    return true;
  }

  return false;
}

function hasTypingSocketForConversation(
  activeUsers: Map<string, Set<string>>,
  socketToTypingConversations: Map<string, Set<string>>,
  userId: string,
  conversationId: string,
  ignoredSocketId?: string,
) {
  const userSockets = activeUsers.get(userId);

  if (!userSockets) {
    return false;
  }

  for (const socketId of userSockets) {
    if (socketId === ignoredSocketId) {
      continue;
    }

    if (socketToTypingConversations.get(socketId)?.has(conversationId)) {
      return true;
    }
  }

  return false;
}

function stopTypingForSocketConversation({
  io,
  activeUsers,
  socketToTypingConversations,
  typingUsers,
  userId,
  socketId,
  conversationId,
}: {
  io: SocketIOServer;
  activeUsers: Map<string, Set<string>>;
  socketToTypingConversations: Map<string, Set<string>>;
  typingUsers: Map<string, Set<string>>;
  userId: string;
  socketId: string;
  conversationId: string;
}) {
  const socketTypingConversations = socketToTypingConversations.get(socketId);

  socketTypingConversations?.delete(conversationId);

  if (socketTypingConversations?.size === 0) {
    socketToTypingConversations.delete(socketId);
  }

  if (
    hasTypingSocketForConversation(
      activeUsers,
      socketToTypingConversations,
      userId,
      conversationId,
      socketId,
    )
  ) {
    return;
  }

  const typingSet = typingUsers.get(conversationId);

  if (!typingSet?.has(userId)) {
    return;
  }

  typingSet.delete(userId);

  if (typingSet.size === 0) {
    typingUsers.delete(conversationId);
  }

  io.except(socketId).to(conversationId).emit("user_stop_typing", {
    userId,
    conversationId,
  });
}

export function initSocket(server: HttpServer) {
  if (!globalForSocket.io) {
    const io = new SocketIOServer(server, {
      cors: {
        origin: "*",
      },
    });
    const {
      activeUsers,
      socketToUser,
      typingUsers,
      socketToTypingConversations,
    } = getSocketState();

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      socket.on("register_user", (userId: string) => {
        const normalizedUserId = userId?.trim();

        if (!normalizedUserId) {
          return;
        }

        const previousUserId = socketToUser.get(socket.id);

        if (previousUserId && previousUserId !== normalizedUserId) {
          removeSocketFromUser(
            activeUsers,
            socketToUser,
            previousUserId,
            socket.id,
          );
        }

        const userSockets = activeUsers.get(normalizedUserId) ?? new Set<string>();
        const wasOffline = userSockets.size === 0;

        userSockets.add(socket.id);
        activeUsers.set(normalizedUserId, userSockets);
        socketToUser.set(socket.id, normalizedUserId);

        if (wasOffline) {
          io.emit("user_online", { userId: normalizedUserId });
        }
      });

      socket.on("get_online_users", () => {
        socket.emit("online_users_list", {
          users: Array.from(activeUsers.keys()),
        });
      });

      socket.on(
        "typing_start",
        (data: { userId?: string; conversationId?: string }) => {
          const conversationId = data?.conversationId?.trim();
          const userId =
            socketToUser.get(socket.id) ?? data?.userId?.trim() ?? null;

          if (!conversationId || !userId) {
            return;
          }

          const socketTypingConversations =
            socketToTypingConversations.get(socket.id) ?? new Set<string>();
          const conversationTypingUsers =
            typingUsers.get(conversationId) ?? new Set<string>();
          const shouldEmit = !conversationTypingUsers.has(userId);

          socketTypingConversations.add(conversationId);
          socketToTypingConversations.set(socket.id, socketTypingConversations);

          conversationTypingUsers.add(userId);
          typingUsers.set(conversationId, conversationTypingUsers);

          if (shouldEmit) {
            socket.to(conversationId).emit("user_typing", {
              userId,
              conversationId,
            });
          }
        },
      );

      socket.on(
        "typing_stop",
        (data: { userId?: string; conversationId?: string }) => {
          const conversationId = data?.conversationId?.trim();
          const userId =
            socketToUser.get(socket.id) ?? data?.userId?.trim() ?? null;

          if (!conversationId || !userId) {
            return;
          }

          stopTypingForSocketConversation({
            io,
            activeUsers,
            socketToTypingConversations,
            typingUsers,
            userId,
            socketId: socket.id,
            conversationId,
          });
        },
      );

      socket.on("join_conversation", (conversationId: string) => {
        socket.join(conversationId);
      });

      socket.on("leave_conversation", (conversationId: string) => {
        socket.leave(conversationId);
      });

      socket.on(
        "send_message",
        (data: {
          conversationId?: string;
          message?: unknown;
        }) => {
          if (!data?.conversationId || !data?.message) {
            return;
          }

          socket.to(data.conversationId).emit("receive_message", data);
        },
      );

      socket.on(
        "delete_message",
        (data: {
          conversationId?: string;
          messageId?: string;
          type?: "everyone" | "me";
          userId?: string;
        }) => {
          if (!data?.conversationId || !data?.messageId || !data?.type) {
            return;
          }

          socket.to(data.conversationId).emit("message_deleted", data);
        },
      );

      socket.on("disconnect", () => {
        const userId = socketToUser.get(socket.id);
        const typingConversations = socketToTypingConversations.get(socket.id);

        if (userId && typingConversations) {
          for (const conversationId of Array.from(typingConversations)) {
            stopTypingForSocketConversation({
              io,
              activeUsers,
              socketToTypingConversations,
              typingUsers,
              userId,
              socketId: socket.id,
              conversationId,
            });
          }
        }

        if (!userId) {
          socketToTypingConversations.delete(socket.id);
          return;
        }

        const shouldBroadcastOffline = removeSocketFromUser(
          activeUsers,
          socketToUser,
          userId,
          socket.id,
        );

        if (shouldBroadcastOffline) {
          io.emit("user_offline", { userId });
        }
      });
    });

    globalForSocket.io = io;
  }

  return globalForSocket.io;
}

export function getSocketServer() {
  return globalForSocket.io ?? null;
}
