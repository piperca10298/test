import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  DELETED_MESSAGE_COPY,
  isValidMessageContent,
  MESSAGE_MAX_LENGTH,
  type MessageDeletionType,
  normalizeMessageContent,
  serializeChatMessage,
} from "@/lib/chat";
import { prisma } from "@/lib/prisma";

function getMessageSelect(currentUserId: string) {
  return {
    id: true,
    content: true,
    createdAt: true,
    senderId: true,
    conversationId: true,
    deletedForEveryone: true,
    deletedForUsers: {
      select: {
        userId: true,
      },
    },
    hiddenMessages: {
      where: {
        userId: currentUserId,
      },
      select: {
        userId: true,
      },
    },
    sender: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };
}

export async function GET(request: Request) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId")?.trim() ?? "";

  if (!conversationId) {
    return NextResponse.json({ message: "Conversation ID is required." }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      users: {
        some: {
          id: currentUser.id,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!conversation) {
    return NextResponse.json({ message: "Conversation not found." }, { status: 404 });
  }

  const [messages, hiddenMessages] = await prisma.$transaction([
    prisma.message.findMany({
      where: {
        conversationId,
        hiddenMessages: {
          none: {
            userId: currentUser.id,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: getMessageSelect(currentUser.id),
    }),
    prisma.hiddenMessage.findMany({
      where: {
        userId: currentUser.id,
        message: {
          conversationId,
        },
      },
      select: {
        messageId: true,
      },
    }),
  ]);

  return NextResponse.json({
    messages: messages.map(serializeChatMessage),
    hiddenMessageIds: hiddenMessages.map((hiddenMessage) => hiddenMessage.messageId),
  });
}

export async function POST(request: Request) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const conversationId =
    typeof body?.conversationId === "string" ? body.conversationId.trim() : "";
  const content = typeof body?.content === "string" ? body.content : "";

  if (!conversationId) {
    return NextResponse.json({ message: "Conversation ID is required." }, { status: 400 });
  }

  if (!isValidMessageContent(content)) {
    return NextResponse.json(
      {
        message: `Messages must be between 1 and ${MESSAGE_MAX_LENGTH} characters.`,
      },
      { status: 400 },
    );
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      users: {
        some: {
          id: currentUser.id,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!conversation) {
    return NextResponse.json({ message: "Conversation not found." }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: currentUser.id,
      content: normalizeMessageContent(content),
    },
    select: getMessageSelect(currentUser.id),
  });

  return NextResponse.json(
    {
      message: serializeChatMessage(message),
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const messageId = typeof body?.messageId === "string" ? body.messageId.trim() : "";
  const type =
    body?.type === "everyone" || body?.type === "me"
      ? (body.type as MessageDeletionType)
      : null;

  if (!messageId) {
    return NextResponse.json({ message: "Message ID is required." }, { status: 400 });
  }

  if (!type) {
    return NextResponse.json({ message: "Delete type is required." }, { status: 400 });
  }

  const existingMessage = await prisma.message.findFirst({
    where: {
      id: messageId,
      conversation: {
        users: {
          some: {
            id: currentUser.id,
          },
        },
      },
    },
    select: {
      id: true,
      senderId: true,
      conversationId: true,
      deletedForEveryone: true,
    },
  });

  if (!existingMessage) {
    return NextResponse.json({ message: "Message not found." }, { status: 404 });
  }

  if (type === "everyone" && existingMessage.senderId !== currentUser.id) {
    return NextResponse.json(
      { message: "Only the sender can delete a message for everyone." },
      { status: 403 },
    );
  }

  const message =
    type === "everyone"
      ? await prisma.message.update({
          where: { id: existingMessage.id },
          data: {
            deletedForEveryone: true,
            content: DELETED_MESSAGE_COPY,
          },
          select: getMessageSelect(currentUser.id),
        })
      : await prisma.$transaction(async (transaction) => {
          await transaction.hiddenMessage.upsert({
            where: {
              userId_messageId: {
                userId: currentUser.id,
                messageId: existingMessage.id,
              },
            },
            update: {},
            create: {
              userId: currentUser.id,
              messageId: existingMessage.id,
            },
          });

          return transaction.message.findUniqueOrThrow({
            where: {
              id: existingMessage.id,
            },
            select: getMessageSelect(currentUser.id),
          });
        });

  return NextResponse.json({
    message: serializeChatMessage(message),
  });
}
