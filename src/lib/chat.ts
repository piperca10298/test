export const SEARCH_QUERY_MIN_LENGTH = 1;
export const USER_SEARCH_LIMIT = 8;
export const MESSAGE_MAX_LENGTH = 2000;
export const CONVERSATION_PREVIEW_SCAN_LIMIT = 25;
export const DELETED_MESSAGE_COPY = "This message was deleted";

export type ChatParticipant = {
  id: string;
  name: string;
  email: string;
};

export type ConversationMessagePreview = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  deletedForEveryone: boolean;
  deletedForUsers: string[];
};

export type ConversationPreview = {
  id: string;
  createdAt: string;
  participant: ChatParticipant;
  lastMessage: ConversationMessagePreview | null;
};

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  conversationId: string;
  deletedForEveryone: boolean;
  deletedForUsers: string[];
  sender: ChatParticipant;
};

export type MessageDeletionType = "everyone" | "me";

export type RealtimeMessagePayload = {
  conversationId: string;
  message: ChatMessage;
};

export type RealtimeMessageDeletionPayload = {
  conversationId: string;
  messageId: string;
  type: MessageDeletionType;
  userId: string;
};

export type PresenceUpdatePayload = {
  userId: string;
};

export type OnlineUsersListPayload = {
  users: string[];
};

export type RealtimeTypingPayload = {
  userId: string;
  conversationId: string;
};

type MessageVisibilityRecord = {
  userId: string;
};

type ConversationPreviewRecord = {
  id: string;
  createdAt: Date;
  users: ChatParticipant[];
  messages: Array<{
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
    deletedForEveryone: boolean;
    deletedForUsers?: MessageVisibilityRecord[];
    hiddenMessages?: MessageVisibilityRecord[];
  }>;
};

type ChatMessageRecord = {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  conversationId: string;
  deletedForEveryone: boolean;
  deletedForUsers?: MessageVisibilityRecord[];
  hiddenMessages?: MessageVisibilityRecord[];
  sender: ChatParticipant;
};

export function normalizeMessageContent(content: string) {
  return content.replace(/\r\n/g, "\n").trim();
}

export function isValidMessageContent(content: string) {
  const normalized = normalizeMessageContent(content);

  return normalized.length > 0 && normalized.length <= MESSAGE_MAX_LENGTH;
}

export function getVisibilityUserIds(
  users: MessageVisibilityRecord[] | string[] = [],
) {
  return users.map((entry) =>
    typeof entry === "string" ? entry : entry.userId,
  );
}

function getHiddenUserIds(
  message: Pick<ConversationPreviewRecord["messages"][number], "deletedForUsers" | "hiddenMessages">,
) {
  return Array.from(
    new Set([
      ...getVisibilityUserIds(message.deletedForUsers ?? []),
      ...getVisibilityUserIds(message.hiddenMessages ?? []),
    ]),
  );
}

export function isMessageHiddenForUser(
  message: Pick<ChatMessage, "deletedForUsers">,
  currentUserId: string,
) {
  return message.deletedForUsers.includes(currentUserId);
}

export function getRenderableMessageContent(
  message: Pick<ChatMessage, "content" | "deletedForEveryone">,
) {
  return message.deletedForEveryone ? DELETED_MESSAGE_COPY : message.content;
}

function getPreviewMessage(
  messages: ConversationPreviewRecord["messages"],
  currentUserId: string,
) {
  return (
    messages.find((message) => {
      if (message.deletedForEveryone) {
        return true;
      }

      return !getHiddenUserIds(message).includes(currentUserId);
    }) ?? null
  );
}

export function serializeConversationPreview(
  conversation: ConversationPreviewRecord,
  currentUserId: string,
): ConversationPreview | null {
  const participant = conversation.users.find((user) => user.id !== currentUserId);

  if (!participant) {
    return null;
  }

  const previewMessage = getPreviewMessage(conversation.messages, currentUserId);

  const lastMessage = previewMessage
    ? {
        id: previewMessage.id,
        content: previewMessage.deletedForEveryone
          ? DELETED_MESSAGE_COPY
          : previewMessage.content,
        createdAt: previewMessage.createdAt.toISOString(),
        senderId: previewMessage.senderId,
        deletedForEveryone: previewMessage.deletedForEveryone,
        deletedForUsers: getHiddenUserIds(previewMessage),
      }
    : null;

  return {
    id: conversation.id,
    createdAt: conversation.createdAt.toISOString(),
    participant,
    lastMessage,
  };
}

export function serializeChatMessage(message: ChatMessageRecord): ChatMessage {
  return {
    id: message.id,
    content: message.deletedForEveryone ? DELETED_MESSAGE_COPY : message.content,
    createdAt: message.createdAt.toISOString(),
    senderId: message.senderId,
    conversationId: message.conversationId,
    deletedForEveryone: message.deletedForEveryone,
    deletedForUsers: getHiddenUserIds(message),
    sender: message.sender,
  };
}
