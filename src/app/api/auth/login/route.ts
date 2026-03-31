import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import {
  buildSessionCookie,
  createSessionToken,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isValidEmail(email) || !isValidPassword(password)) {
    return NextResponse.json(
      { message: "Enter a valid email and password." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Invalid email or password." },
      { status: 401 },
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return NextResponse.json(
      { message: "Invalid email or password." },
      { status: 401 },
    );
  }

  const token = await createSessionToken({
    id: user.id,
    name: user.name,
    email: user.email,
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });

  response.cookies.set(buildSessionCookie(token));

  return response;
}
