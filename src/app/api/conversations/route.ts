import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CONVERSATION_PREVIEW_SCAN_LIMIT,
  serializeConversationPreview,
} from "@/lib/chat";

function isNonNullable<T>(value: T | null): value is T {
  return value !== null;
}

function getConversationSelect(currentUserId: string) {
  return {
    id: true,
    createdAt: true,
    users: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    messages: {
      orderBy: {
        createdAt: "desc" as const,
      },
      take: CONVERSATION_PREVIEW_SCAN_LIMIT,
      select: {
        id: true,
        content: true,
        createdAt: true,
        senderId: true,
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
      },
    },
  };
}

export async function GET() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      users: {
        some: {
          id: currentUser.id,
        },
      },
    },
    select: getConversationSelect(currentUser.id),
  });

  const items = conversations
    .map((conversation) => serializeConversationPreview(conversation, currentUser.id))
    .filter(isNonNullable)
    .sort((left, right) => {
      const leftDate = new Date(left.lastMessage?.createdAt ?? left.createdAt).getTime();
      const rightDate = new Date(right.lastMessage?.createdAt ?? right.createdAt).getTime();

      return rightDate - leftDate;
    });

  return NextResponse.json({ conversations: items });
}

export async function POST(request: Request) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";

  if (!userId) {
    return NextResponse.json({ message: "Select a user to start chatting." }, { status: 400 });
  }

  if (userId === currentUser.id) {
    return NextResponse.json({ message: "You cannot create a conversation with yourself." }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!targetUser) {
    return NextResponse.json({ message: "The selected user could not be found." }, { status: 404 });
  }

  const existingConversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        {
          users: {
            some: {
              id: currentUser.id,
            },
          },
        },
        {
          users: {
            some: {
              id: userId,
            },
          },
        },
        {
          users: {
            every: {
              id: {
                in: [currentUser.id, userId],
              },
            },
          },
        },
      ],
    },
    select: getConversationSelect(currentUser.id),
  });

  if (existingConversation) {
    const conversation = serializeConversationPreview(existingConversation, currentUser.id);

    return NextResponse.json({ conversation });
  }

  const conversation = await prisma.conversation.create({
    data: {
      users: {
        connect: [{ id: currentUser.id }, { id: userId }],
      },
    },
    select: getConversationSelect(currentUser.id),
  });

  return NextResponse.json(
    {
      conversation: serializeConversationPreview(conversation, currentUser.id),
    },
    { status: 201 },
  );
}
