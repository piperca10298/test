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
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  const name = typeof (body as { name?: unknown })?.name === "string"
    ? (body as { name: string }).name.trim()
    : "";
  const rawEmail = typeof (body as { email?: unknown })?.email === "string"
    ? (body as { email: string }).email
    : "";
  const password = typeof (body as { password?: unknown })?.password === "string"
    ? (body as { password: string }).password
    : "";

  if (!name || !rawEmail || !password) {
    return NextResponse.json(
      { message: "Name, email, and password are required." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(rawEmail);

  if (!isValidName(name)) {
    return NextResponse.json(
      { message: "Please enter a valid name." },
      { status: 400 },
    );
  }

  if (!email) {
    return NextResponse.json(
      { message: "Please enter a valid email address." },
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

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
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
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Unable to create account right now." },
      { status: 500 },
    );
  }
}
