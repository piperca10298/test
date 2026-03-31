import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import {
  buildSessionCookie,
  createSessionToken,
  isValidEmail,
  isValidName,
  isValidPassword,
  normalizeEmail,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isValidName(name)) {
    return NextResponse.json(
      { message: "Please enter a valid name." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { message: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { message: "An account already exists for that email." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const token = await createSessionToken(user);
  const response = NextResponse.json({ user });
  response.cookies.set(buildSessionCookie(token));

  return response;
}
