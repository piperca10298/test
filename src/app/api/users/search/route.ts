import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SEARCH_QUERY_MIN_LENGTH, USER_SEARCH_LIMIT } from "@/lib/chat";

export async function GET(request: Request) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";

  if (query.length < SEARCH_QUERY_MIN_LENGTH) {
    return NextResponse.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      OR: [
        {
          name: {
            contains: query,
          },
        },
        {
          email: {
            contains: query,
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    take: USER_SEARCH_LIMIT,
  });

  return NextResponse.json({ users });
}
