import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const messageId = typeof body?.messageId === "string" ? body.messageId.trim() : "";

  if (!messageId) {
    return NextResponse.json({ message: "Message ID is required." }, { status: 400 });
  }

  const message = await prisma.message.findFirst({
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
      conversationId: true,
    },
  });

  if (!message) {
    return NextResponse.json({ message: "Message not found." }, { status: 404 });
  }

  await prisma.hiddenMessage.upsert({
    where: {
      userId_messageId: {
        userId: currentUser.id,
        messageId: message.id,
      },
    },
    update: {},
    create: {
      userId: currentUser.id,
      messageId: message.id,
    },
  });

  return NextResponse.json({
    messageId: message.id,
    conversationId: message.conversationId,
  });
}
