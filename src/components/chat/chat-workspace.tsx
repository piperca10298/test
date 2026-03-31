"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  LoaderCircle,
  MessageSquareMore,
  Radio,
  Search,
  SendHorizontal,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import type { SessionUser } from "@/lib/auth";
import type {
  ChatMessage,
  ChatParticipant,
  ConversationPreview,
  MessageDeletionType,
  OnlineUsersListPayload,
  PresenceUpdatePayload,
  RealtimeMessageDeletionPayload,
  RealtimeMessagePayload,
  RealtimeTypingPayload,
} from "@/lib/chat";
import {
  isMessageHiddenForUser,
  MESSAGE_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
} from "@/lib/chat";
import { ChatMessageBubble } from "@/components/chat/chat-message-bubble";

type ChatWorkspaceProps = {
  currentUser: SessionUser;
};

type ApiError = {
  message?: string;
};

type SearchUsersResponse = {
  users: ChatParticipant[];
};

type ConversationsResponse = {
  conversations: ConversationPreview[];
};

type ConversationResponse = {
  conversation: ConversationPreview | null;
};

type MessagesResponse = {
  messages: ChatMessage[];
  hiddenMessageIds: string[];
};

type MessageResponse = {
  message?: ChatMessage;
};

type HideMessageResponse = {
  messageId?: string;
  conversationId?: string;
};

type MessageMutationResponse = MessageResponse | ApiError;

type SyncOptions = {
  preferredConversationId?: string | null;
  silent?: boolean;
};

const MESSAGE_POLL_MS = 4000;
const CONVERSATION_POLL_MS = 7000;

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null;
}

async function requestConversations() {
  const response = await fetch("/api/conversations", {
    cache: "no-store",
  });
  const data = await readJson<ConversationsResponse & ApiError>(response);

  return { response, data };
}

async function requestMessages(conversationId: string) {
  const response = await fetch(
    `/api/messages?conversationId=${encodeURIComponent(conversationId)}`,
    {
      cache: "no-store",
    },
  );
  const data = await readJson<MessagesResponse & ApiError>(response);

  return { response, data };
}

async function requestUserSearch(query: string, signal: AbortSignal) {
  const response = await fetch(
    `/api/users/search?query=${encodeURIComponent(query)}`,
    {
      cache: "no-store",
      signal,
    },
  );
  const data = await readJson<SearchUsersResponse & ApiError>(response);

  return { response, data };
}

async function requestConversationOpen(userId: string) {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  const data = await readJson<ConversationResponse & ApiError>(response);

  return { response, data };
}

async function requestMessageSend(conversationId: string, content: string) {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversationId,
      content,
    }),
  });
  const data = await readJson<MessageMutationResponse>(response);

  return { response, data };
}

async function requestMessageDelete(
  messageId: string,
  type: MessageDeletionType,
) {
  const response = await fetch("/api/messages", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageId,
      type,
    }),
  });
  const data = await readJson<MessageMutationResponse>(response);

  return { response, data };
}

async function requestMessageHide(messageId: string) {
  const response = await fetch("/api/messages/hide", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageId,
    }),
  });
  const data = await readJson<HideMessageResponse & ApiError>(response);

  return { response, data };
}

function resolveSelectedConversationId(
  conversations: ConversationPreview[],
  currentValue: string | null,
  preferredConversationId?: string | null,
) {
  const nextValue = preferredConversationId ?? currentValue;

  if (
    nextValue &&
    conversations.some((conversation) => conversation.id === nextValue)
  ) {
    return nextValue;
  }

  return conversations[0]?.id ?? null;
}

function formatConversationTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getLastMessagePreview(
  conversation: ConversationPreview,
  currentUserId: string,
) {
  if (!conversation.lastMessage) {
    return "No messages yet. Open the neural channel.";
  }

  if (conversation.lastMessage.deletedForEveryone) {
    return "This message was deleted";
  }

  const prefix =
    conversation.lastMessage.senderId === currentUserId ? "You: " : "";

  return `${prefix}${conversation.lastMessage.content}`;
}

function upsertMessage(messages: ChatMessage[], message: ChatMessage) {
  const messageIndex = messages.findIndex(
    (currentMessage) => currentMessage.id === message.id,
  );

  if (messageIndex === -1) {
    return [...messages, message];
  }

  if (messages[messageIndex] === message) {
    return messages;
  }

  const nextMessages = [...messages];
  nextMessages[messageIndex] = message;

  return nextMessages;
}

function removeMessage(messages: ChatMessage[], messageId: string) {
  const nextMessages = messages.filter((message) => message.id !== messageId);

  return nextMessages.length === messages.length ? messages : nextMessages;
}

function applyMessageDeletion(
  messages: ChatMessage[],
  payload: RealtimeMessageDeletionPayload,
) {
  const messageIndex = messages.findIndex(
    (message) => message.id === payload.messageId,
  );

  if (messageIndex === -1) {
    return messages;
  }

  const targetMessage = messages[messageIndex];
  let nextMessage = targetMessage;

  if (payload.type === "everyone") {
    if (targetMessage.deletedForEveryone) {
      return messages;
    }

    nextMessage = {
      ...targetMessage,
      deletedForEveryone: true,
    };
  } else if (!targetMessage.deletedForUsers.includes(payload.userId)) {
    nextMessage = {
      ...targetMessage,
      deletedForUsers: [...targetMessage.deletedForUsers, payload.userId],
    };
  }

  if (nextMessage === targetMessage) {
    return messages;
  }

  const nextMessages = [...messages];
  nextMessages[messageIndex] = nextMessage;

  return nextMessages;
}

function buildConversationPreviewMessage(message: ChatMessage) {
  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    senderId: message.senderId,
    deletedForEveryone: message.deletedForEveryone,
    deletedForUsers: message.deletedForUsers,
  };
}

function bumpConversationWithMessage(
  conversations: ConversationPreview[],
  message: ChatMessage,
) {
  const conversationIndex = conversations.findIndex(
    (conversation) => conversation.id === message.conversationId,
  );

  if (conversationIndex === -1) {
    return conversations;
  }

  const nextLastMessage = buildConversationPreviewMessage(message);
  const targetConversation = conversations[conversationIndex];
  const nextConversation =
    targetConversation.lastMessage?.id === nextLastMessage.id &&
    targetConversation.lastMessage.content === nextLastMessage.content &&
    targetConversation.lastMessage.createdAt === nextLastMessage.createdAt &&
    targetConversation.lastMessage.deletedForEveryone ===
      nextLastMessage.deletedForEveryone &&
    targetConversation.lastMessage.senderId === nextLastMessage.senderId &&
    targetConversation.lastMessage.deletedForUsers.length ===
      nextLastMessage.deletedForUsers.length &&
    targetConversation.lastMessage.deletedForUsers.every(
      (userId, index) => userId === nextLastMessage.deletedForUsers[index],
    )
      ? targetConversation
      : {
          ...targetConversation,
          lastMessage: nextLastMessage,
        };

  if (conversationIndex === 0 && nextConversation === targetConversation) {
    return conversations;
  }

  const remainingConversations = conversations.filter(
    (conversation) => conversation.id !== message.conversationId,
  );

  return [nextConversation, ...remainingConversations];
}

function addTypingUserToConversation(
  currentTypingUsers: Record<string, string[]>,
  payload: RealtimeTypingPayload,
) {
  const users = currentTypingUsers[payload.conversationId] ?? [];

  if (users.includes(payload.userId)) {
    return currentTypingUsers;
  }

  return {
    ...currentTypingUsers,
    [payload.conversationId]: [...users, payload.userId],
  };
}

function removeTypingUserFromConversation(
  currentTypingUsers: Record<string, string[]>,
  payload: RealtimeTypingPayload,
) {
  const users = currentTypingUsers[payload.conversationId] ?? [];

  if (!users.includes(payload.userId)) {
    return currentTypingUsers;
  }

  const nextUsers = users.filter((userId) => userId !== payload.userId);

  if (nextUsers.length === 0) {
    const nextTypingUsers = { ...currentTypingUsers };
    delete nextTypingUsers[payload.conversationId];

    return nextTypingUsers;
  }

  return {
    ...currentTypingUsers,
    [payload.conversationId]: nextUsers,
  };
}

function syncOnlineUsers(
  currentUsers: string[],
  nextUsers: string[],
) {
  const dedupedUsers = Array.from(new Set(nextUsers));

  if (
    currentUsers.length === dedupedUsers.length &&
    currentUsers.every((userId, index) => userId === dedupedUsers[index])
  ) {
    return currentUsers;
  }

  return dedupedUsers;
}

function addOnlineUser(currentUsers: string[], userId: string) {
  if (currentUsers.includes(userId)) {
    return currentUsers;
  }

  return [...currentUsers, userId];
}

function removeOnlineUser(currentUsers: string[], userId: string) {
  if (!currentUsers.includes(userId)) {
    return currentUsers;
  }

  return currentUsers.filter((currentUserId) => currentUserId !== userId);
}

function syncHiddenMessageIds(currentIds: string[], nextIds: string[]) {
  const normalizedIds = Array.from(new Set(nextIds)).sort((left, right) =>
    left.localeCompare(right),
  );

  if (
    currentIds.length === normalizedIds.length &&
    currentIds.every((messageId, index) => messageId === normalizedIds[index])
  ) {
    return currentIds;
  }

  return normalizedIds;
}

function addHiddenMessageId(currentIds: string[], messageId: string) {
  if (currentIds.includes(messageId)) {
    return currentIds;
  }

  return [...currentIds, messageId].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function ChatWorkspace({ currentUser }: ChatWorkspaceProps) {
  const router = useRouter();
  const messageListRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const hiddenMessagesRef = useRef<string[]>([]);
  const joinedConversationIdRef = useRef<string | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const typingConversationIdRef = useRef<string | null>(null);
  const syncConversationsRef = useRef<(options?: SyncOptions) => Promise<void>>(
    async () => {},
  );
  const syncMessagesRef = useRef<
    (conversationId: string, options?: Pick<SyncOptions, "silent">) => Promise<void>
  >(async () => {});

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const [searchResults, setSearchResults] = useState<ChatParticipant[]>([]);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hiddenMessages, setHiddenMessages] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");

  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
  const isSelectedUserOnline = selectedConversation
    ? onlineUsers.includes(selectedConversation.participant.id)
    : false;
  const activeTypingUsers = selectedConversationId
    ? typingUsers[selectedConversationId] ?? []
    : [];
  const renderableMessages = messages.filter(
    (message) =>
      !hiddenMessages.includes(message.id) &&
      !isMessageHiddenForUser(message, currentUser.id),
  );

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    hiddenMessagesRef.current = hiddenMessages;
  }, [hiddenMessages]);

  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  const stopTyping = useCallback(
    (conversationId = typingConversationIdRef.current) => {
      if (!conversationId) {
        clearTypingTimeout();
        isTypingRef.current = false;
        typingConversationIdRef.current = null;
        return;
      }

      clearTypingTimeout();

      if (isTypingRef.current) {
        socketRef.current?.emit("typing_stop", {
          userId: currentUser.id,
          conversationId,
        } satisfies RealtimeTypingPayload);
      }

      isTypingRef.current = false;
      typingConversationIdRef.current = null;
    },
    [clearTypingTimeout, currentUser.id],
  );

  const scheduleTypingStop = useCallback(
    (conversationId: string) => {
      clearTypingTimeout();

      typingTimeoutRef.current = window.setTimeout(() => {
        stopTyping(conversationId);
      }, 1500);
    },
    [clearTypingTimeout, stopTyping],
  );

  syncConversationsRef.current = async (options = {}) => {
    const { preferredConversationId, silent = false } = options;

    if (!silent) {
      setIsLoadingConversations(true);
    }

    try {
      const { response, data } = await requestConversations();

      if (response.status === 401) {
        router.replace("/access");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message ?? "Unable to load conversations.");
      }

      const nextConversations = data?.conversations ?? [];

      setConversations(nextConversations);
      setSelectedConversationId((currentValue) =>
        resolveSelectedConversationId(
          nextConversations,
          currentValue,
          preferredConversationId,
        ),
      );
    } catch (loadError) {
      console.error(loadError);

      if (!silent) {
        setError("Unable to load conversations right now.");
      }
    } finally {
      if (!silent) {
        setIsLoadingConversations(false);
      }
    }
  };

  syncMessagesRef.current = async (conversationId, options = {}) => {
    const { silent = false } = options;

    if (!conversationId) {
      setMessages([]);
      setHiddenMessages([]);
      return;
    }

    if (!silent) {
      setIsLoadingMessages(true);
    }

    try {
      const { response, data } = await requestMessages(conversationId);

      if (selectedConversationIdRef.current !== conversationId) {
        return;
      }

      if (response.status === 401) {
        router.replace("/access");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message ?? "Unable to load messages.");
      }

      setMessages(data?.messages ?? []);
      setHiddenMessages((currentIds) =>
        syncHiddenMessageIds(currentIds, data?.hiddenMessageIds ?? []),
      );
    } catch (loadError) {
      console.error(loadError);

      if (!silent) {
        setError("Unable to load messages right now.");
      }
    } finally {
      if (!silent && selectedConversationIdRef.current === conversationId) {
        setIsLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    void syncConversationsRef.current();

    const intervalId = window.setInterval(() => {
      void syncConversationsRef.current({ silent: true });
    }, CONVERSATION_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      stopTyping();
      setMessages([]);
      setHiddenMessages([]);
      return;
    }

    if (
      typingConversationIdRef.current &&
      typingConversationIdRef.current !== selectedConversationId
    ) {
      stopTyping(typingConversationIdRef.current);
    }

    void syncMessagesRef.current(selectedConversationId);

    const socket = socketRef.current;
    const previousConversationId = joinedConversationIdRef.current;

    if (socket) {
      if (
        previousConversationId &&
        previousConversationId !== selectedConversationId
      ) {
        socket.emit("leave_conversation", previousConversationId);
      }

      socket.emit("join_conversation", selectedConversationId);
      joinedConversationIdRef.current = selectedConversationId;
    }

    const intervalId = window.setInterval(() => {
      void syncMessagesRef.current(selectedConversationId, { silent: true });
    }, MESSAGE_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedConversationId, stopTyping]);

  useEffect(() => {
    const query = deferredSearchQuery.trim();

    if (query.length < SEARCH_QUERY_MIN_LENGTH) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();

    setIsSearching(true);

    void (async () => {
      try {
        const { response, data } = await requestUserSearch(
          query,
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        if (response.status === 401) {
          router.replace("/access");
          return;
        }

        if (!response.ok) {
          throw new Error(data?.message ?? "Unable to search users.");
        }

        setSearchResults(data?.users ?? []);
      } catch (searchError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(searchError);
        setError("Unable to search users right now.");
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    })();

    return () => controller.abort();
  }, [deferredSearchQuery, router]);

  useEffect(() => {
    const list = messageListRef.current;

    if (!list) {
      return;
    }

    list.scrollTo({
      top: list.scrollHeight,
      behavior: "smooth",
    });
  }, [renderableMessages, selectedConversationId]);

  useEffect(() => {
    if (socketRef.current) {
      return;
    }

    let nextSocket: Socket | null = null;

    try {
      nextSocket = io({
        transports: ["websocket", "polling"],
      });

      socketRef.current = nextSocket;

      nextSocket.on("connect", () => {
        setIsSocketConnected(true);
        nextSocket?.emit("register_user", currentUser.id);
        nextSocket?.emit("get_online_users");

        if (selectedConversationIdRef.current) {
          nextSocket?.emit("join_conversation", selectedConversationIdRef.current);
          joinedConversationIdRef.current = selectedConversationIdRef.current;
        }
      });

      nextSocket.on("disconnect", () => {
        setIsSocketConnected(false);
      });

      nextSocket.on("connect_error", (socketError) => {
        console.error("Socket connection failed.", socketError);
        setIsSocketConnected(false);
      });

      nextSocket.on("online_users_list", (payload: OnlineUsersListPayload) => {
        setOnlineUsers((currentUsers) =>
          syncOnlineUsers(currentUsers, payload.users),
        );
      });

      nextSocket.on("user_online", ({ userId }: PresenceUpdatePayload) => {
        setOnlineUsers((currentUsers) => addOnlineUser(currentUsers, userId));
      });

      nextSocket.on("user_offline", ({ userId }: PresenceUpdatePayload) => {
        setOnlineUsers((currentUsers) => removeOnlineUser(currentUsers, userId));
      });

      nextSocket.on("receive_message", (payload: RealtimeMessagePayload) => {
        if (hiddenMessagesRef.current.includes(payload.message.id)) {
          return;
        }

        setConversations((currentConversations) =>
          bumpConversationWithMessage(currentConversations, payload.message),
        );
        setTypingUsers((currentTypingUsers) =>
          removeTypingUserFromConversation(currentTypingUsers, {
            userId: payload.message.senderId,
            conversationId: payload.conversationId,
          }),
        );

        if (payload.conversationId !== selectedConversationIdRef.current) {
          return;
        }

        setMessages((currentMessages) =>
          upsertMessage(currentMessages, payload.message),
        );
      });

      nextSocket.on(
        "message_deleted",
        (payload: RealtimeMessageDeletionPayload) => {
          if (
            payload.conversationId === selectedConversationIdRef.current &&
            !hiddenMessagesRef.current.includes(payload.messageId)
          ) {
            setMessages((currentMessages) =>
              applyMessageDeletion(currentMessages, payload),
            );
          }

          void syncConversationsRef.current({
            preferredConversationId: selectedConversationIdRef.current,
            silent: true,
          });
        },
      );

      nextSocket.on("user_typing", (payload: RealtimeTypingPayload) => {
        if (payload.userId === currentUser.id) {
          return;
        }

        setTypingUsers((currentTypingUsers) =>
          addTypingUserToConversation(currentTypingUsers, payload),
        );
      });

      nextSocket.on("user_stop_typing", (payload: RealtimeTypingPayload) => {
        if (payload.userId === currentUser.id) {
          return;
        }

        setTypingUsers((currentTypingUsers) =>
          removeTypingUserFromConversation(currentTypingUsers, payload),
        );
      });
    } catch (socketError) {
      console.error("Unable to initialize the realtime relay.", socketError);
    }

    return () => {
      stopTyping();

      if (joinedConversationIdRef.current && nextSocket) {
        nextSocket.emit("leave_conversation", joinedConversationIdRef.current);
      }

      nextSocket?.disconnect();
      socketRef.current = null;
      joinedConversationIdRef.current = null;
    };
  }, [currentUser.id, stopTyping]);

  const openConversation = useCallback(async (userId: string) => {
    setError(null);
    setIsOpeningConversation(true);

    try {
      const { response, data } = await requestConversationOpen(userId);

      if (response.status === 401) {
        router.replace("/access");
        return;
      }

      if (!response.ok || !data?.conversation) {
        throw new Error(data?.message ?? "Unable to open the conversation.");
      }

      const nextConversationId = data.conversation.id;

      setSearchQuery("");
      setSearchResults([]);
      setSelectedConversationId(nextConversationId);

      await Promise.all([
        syncConversationsRef.current({
          preferredConversationId: nextConversationId,
          silent: true,
        }),
        syncMessagesRef.current(nextConversationId, { silent: true }),
      ]);
    } catch (openError) {
      console.error(openError);
      setError("Unable to start that conversation right now.");
    } finally {
      setIsOpeningConversation(false);
    }
  }, [router]);

  const handleSearchResultClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const userId = event.currentTarget.dataset.userId;

      if (userId) {
        void openConversation(userId);
      }
    },
    [openConversation],
  );

  const handleConversationSelect = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const conversationId = event.currentTarget.dataset.conversationId;

      if (conversationId) {
        setSelectedConversationId(conversationId);
      }
    },
    [],
  );

  const handleComposerChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      const conversationId = selectedConversationIdRef.current;

      setComposer(nextValue);

      if (!conversationId) {
        return;
      }

      if (!nextValue.trim()) {
        stopTyping(conversationId);
        return;
      }

      if (
        !isTypingRef.current ||
        typingConversationIdRef.current !== conversationId
      ) {
        if (
          typingConversationIdRef.current &&
          typingConversationIdRef.current !== conversationId
        ) {
          stopTyping(typingConversationIdRef.current);
        }

        socketRef.current?.emit("typing_start", {
          userId: currentUser.id,
          conversationId,
        } satisfies RealtimeTypingPayload);
        isTypingRef.current = true;
        typingConversationIdRef.current = conversationId;
      }

      scheduleTypingStop(conversationId);
    },
    [currentUser.id, scheduleTypingStop, stopTyping],
  );

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedConversationId || !composer.trim()) {
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      const { response, data } = await requestMessageSend(
        selectedConversationId,
        composer,
      );

      if (response.status === 401) {
        router.replace("/access");
        return;
      }

      const messagePayload =
        data?.message && typeof data.message !== "string" ? data.message : null;

      if (!response.ok || !messagePayload) {
        const errorMessage =
          data?.message && typeof data.message === "string"
            ? data.message
            : "Unable to send the message.";
        throw new Error(errorMessage);
      }

      setComposer("");
      stopTyping(selectedConversationId);
      setMessages((currentMessages) =>
        upsertMessage(currentMessages, messagePayload),
      );
      setConversations((currentConversations) =>
        bumpConversationWithMessage(currentConversations, messagePayload),
      );
      setTypingUsers((currentTypingUsers) =>
        removeTypingUserFromConversation(currentTypingUsers, {
          userId: currentUser.id,
          conversationId: selectedConversationId,
        }),
      );

      socketRef.current?.emit("send_message", {
        conversationId: selectedConversationId,
        message: messagePayload,
      } satisfies RealtimeMessagePayload);
    } catch (sendError) {
      console.error(sendError);
      setError("Unable to send your message right now.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = useCallback(async (
    messageId: string,
    type: MessageDeletionType,
  ) => {
    const conversationId = selectedConversationIdRef.current;

    if (!conversationId) {
      return;
    }

    setError(null);
    setPendingDeleteMessageId(messageId);

    try {
      if (type === "me") {
        const { response, data } = await requestMessageHide(messageId);

        if (response.status === 401) {
          router.replace("/access");
          return;
        }

        if (!response.ok || !data?.messageId) {
          const errorMessage =
            data?.message && typeof data.message === "string"
              ? data.message
              : "Unable to hide the message.";
          throw new Error(errorMessage);
        }

        setHiddenMessages((currentIds) =>
          addHiddenMessageId(currentIds, data.messageId ?? messageId),
        );
        setMessages((currentMessages) => removeMessage(currentMessages, messageId));

        await syncConversationsRef.current({
          preferredConversationId: conversationId,
          silent: true,
        });

        return;
      }

      const { response, data } = await requestMessageDelete(messageId, type);

      const messagePayload =
        data?.message && typeof data.message !== "string" ? data.message : null;

      if (response.status === 401) {
        router.replace("/access");
        return;
      }

      if (!response.ok || !messagePayload) {
        const errorMessage =
          data?.message && typeof data.message === "string"
            ? data.message
            : "Unable to delete the message.";
        throw new Error(errorMessage);
      }

      setMessages((currentMessages) =>
        upsertMessage(currentMessages, messagePayload),
      );

      socketRef.current?.emit("delete_message", {
        conversationId,
        messageId,
        type,
        userId: currentUser.id,
      } satisfies RealtimeMessageDeletionPayload);

      await syncConversationsRef.current({
        preferredConversationId: conversationId,
        silent: true,
      });
    } catch (deleteError) {
      console.error(deleteError);
      setError("Unable to update that message right now.");
    } finally {
      setPendingDeleteMessageId(null);
    }
  }, [currentUser.id, router]);

  return (
    <div className="flex h-full w-full flex-col gap-6 lg:flex-row">
      <aside className="glass-panel panel-shine flex h-[26rem] w-full flex-col overflow-hidden rounded-[32px] lg:h-full lg:max-w-[24rem]">
        <div className="border-b border-white/8 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">
                Neural relay
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold text-white">
                Direct <span className="text-gradient-cyan">Messages</span>
              </h1>
            </div>
            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs uppercase tracking-[0.24em] text-cyan-100">
              {isSocketConnected ? "Realtime live" : "Polling fallback"}
            </div>
          </div>

          <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.03] p-3">
            <label className="flex items-center gap-3">
              <Search className="size-4 text-cyan-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or email"
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            <Sparkles className="size-4 text-cyan-300" />
            <span>Signed in as {currentUser.name}</span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-white/8 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Search results
              </p>
              {isSearching || isOpeningConversation ? (
                <LoaderCircle className="size-4 animate-spin text-cyan-300" />
              ) : null}
            </div>

            <div className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-1">
              {deferredSearchQuery.trim().length < SEARCH_QUERY_MIN_LENGTH ? (
                <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-slate-500">
                  Search for another NeuroGrid user to open a direct channel.
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    data-user-id={user.id}
                    onClick={handleSearchResultClick}
                    className="group flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-left transition-all duration-300 hover:border-cyan-400/24 hover:bg-cyan-400/[0.06]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{user.email}</p>
                    </div>
                    <ArrowUpRight className="size-4 text-slate-500 transition-colors duration-300 group-hover:text-cyan-300" />
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-slate-500">
                  No matches yet for &quot;{deferredSearchQuery.trim()}&quot;.
                </div>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <UsersRound className="size-4 text-cyan-300" />
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  Conversations
                </p>
              </div>
              {isLoadingConversations ? (
                <LoaderCircle className="size-4 animate-spin text-cyan-300" />
              ) : null}
            </div>

            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {conversations.length > 0 ? (
                conversations.map((conversation) => {
                  const isActive = conversation.id === selectedConversationId;
                  const isParticipantOnline = onlineUsers.includes(
                    conversation.participant.id,
                  );

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      data-conversation-id={conversation.id}
                      onClick={handleConversationSelect}
                      className={[
                        "w-full rounded-[24px] border px-4 py-4 text-left transition-all duration-300",
                        isActive
                          ? "border-cyan-400/24 bg-cyan-400/[0.08] shadow-[0_0_32px_rgba(34,211,238,0.08)]"
                          : "border-white/8 bg-white/[0.03] hover:border-cyan-400/18 hover:bg-white/[0.05]",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={[
                                "inline-flex size-2.5 rounded-full",
                                isParticipantOnline
                                  ? "bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]"
                                  : "bg-slate-500",
                              ].join(" ")}
                            />
                            <p className="text-sm font-semibold text-white">
                              {conversation.participant.name}
                            </p>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                            {getLastMessagePreview(conversation, currentUser.id)}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                          {formatConversationTime(
                            conversation.lastMessage?.createdAt ?? conversation.createdAt,
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="glass-panel rounded-[28px] px-5 py-6 text-sm text-slate-400">
                  No conversations yet. Search for a user and open your first secure thread.
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <section className="glass-panel panel-shine flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-[32px]">
        {selectedConversation ? (
          <>
            <header className="border-b border-white/8 px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">
                    Active thread
                  </p>
                  <h2 className="mt-3 font-display text-4xl font-semibold text-white">
                    {selectedConversation.participant.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                    <p>{selectedConversation.participant.email}</p>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-300">
                      <span
                        className={[
                          "inline-flex size-2 rounded-full",
                          isSelectedUserOnline
                            ? "bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]"
                            : "bg-slate-500",
                        ].join(" ")}
                      />
                      {isSelectedUserOnline ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                    <Radio className="size-3.5 text-cyan-300" />
                    {isSocketConnected ? "Socket relay live" : "API fallback live"}
                  </div>
                  <p className="mt-2 text-sm text-slate-200">
                    Poll backup every {MESSAGE_POLL_MS / 1000}s
                  </p>
                </div>
              </div>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                ref={messageListRef}
                className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-6"
              >
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-10">
                    <LoaderCircle className="size-6 animate-spin text-cyan-300" />
                  </div>
                ) : renderableMessages.length > 0 ? (
                  <AnimatePresence initial={false}>
                    {renderableMessages.map((message) => {
                      const isOwnMessage = message.senderId === currentUser.id;

                      return (
                        <motion.div
                          key={message.id}
                          layout
                          initial={{ opacity: 0, y: 18, scale: 0.985 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.98 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className={[
                            "flex",
                            isOwnMessage ? "justify-end" : "justify-start",
                          ].join(" ")}
                        >
                          <ChatMessageBubble
                            currentUserId={currentUser.id}
                            isDeleting={pendingDeleteMessageId === message.id}
                            message={message}
                            onDelete={handleDeleteMessage}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <div className="max-w-md rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-8 text-center">
                      <MessageSquareMore className="mx-auto size-8 text-cyan-300" />
                      <h3 className="mt-4 font-display text-2xl font-semibold text-white">
                        Channel open
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-400">
                        This thread is ready. Send the first message to begin the
                        conversation.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="min-h-7 px-6 py-1 text-sm text-slate-400">
                <AnimatePresence initial={false} mode="wait">
                  {activeTypingUsers.length > 0 ? (
                    <motion.div
                      key="typing-indicator"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="inline-flex items-center gap-2"
                    >
                      <span className="opacity-85">
                        {selectedConversation.participant.name} is typing
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {[0, 1, 2].map((dot) => (
                          <motion.span
                            key={dot}
                            className="size-1.5 rounded-full bg-cyan-300/80"
                            animate={{ opacity: [0.25, 1, 0.25], y: [0, -1.5, 0] }}
                            transition={{
                              duration: 0.9,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                              delay: dot * 0.12,
                            }}
                          />
                        ))}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="typing-placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      className="h-5"
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-white/8 px-6 py-5">
                {error ? (
                  <div className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleSendMessage} className="flex flex-col gap-4 sm:flex-row">
                  <input
                    type="text"
                    value={composer}
                    onChange={handleComposerChange}
                    placeholder={`Transmit a message (${MESSAGE_MAX_LENGTH} char max)`}
                    maxLength={MESSAGE_MAX_LENGTH}
                    disabled={isSending}
                    className="h-14 flex-1 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 text-sm text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400/28 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-70"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !composer.trim()}
                    className="neuro-button-primary h-14 shrink-0 px-6 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <SendHorizontal className="size-4" />
                    )}
                    Send
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-1 items-center justify-center px-6 py-10">
            <div className="max-w-xl rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] px-8 py-10 text-center">
              <MessageSquareMore className="mx-auto size-10 text-cyan-300" />
              <h2 className="mt-5 font-display text-4xl font-semibold text-white">
                Open a <span className="text-gradient-cyan">direct thread</span>
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-400">
                Search for another user in the sidebar, create a conversation,
                and messages will persist to the NeuroGrid database.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
