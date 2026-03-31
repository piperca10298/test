import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import Database from "better-sqlite3";

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

if (!databaseUrl.startsWith("file:")) {
  throw new Error("NeuroGrid auth bootstrap only supports SQLite file URLs.");
}

const rawPath = databaseUrl.slice("file:".length);
const resolvedPath = path.isAbsolute(rawPath)
  ? rawPath
  : path.resolve(process.cwd(), rawPath);

fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);

db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

  CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "deletedForEveryone" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "MessageDeletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    CONSTRAINT "MessageDeletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageDeletion_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "HiddenMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HiddenMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HiddenMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "_UserConversations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_UserConversations_A_fkey" FOREIGN KEY ("A") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UserConversations_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
  CREATE INDEX IF NOT EXISTS "Message_senderId_idx" ON "Message"("senderId");
  CREATE UNIQUE INDEX IF NOT EXISTS "MessageDeletion_messageId_userId_key" ON "MessageDeletion"("messageId", "userId");
  CREATE INDEX IF NOT EXISTS "MessageDeletion_userId_idx" ON "MessageDeletion"("userId");
  CREATE UNIQUE INDEX IF NOT EXISTS "HiddenMessage_userId_messageId_key" ON "HiddenMessage"("userId", "messageId");
  CREATE INDEX IF NOT EXISTS "HiddenMessage_userId_idx" ON "HiddenMessage"("userId");
  CREATE INDEX IF NOT EXISTS "HiddenMessage_messageId_idx" ON "HiddenMessage"("messageId");
  CREATE UNIQUE INDEX IF NOT EXISTS "_UserConversations_AB_unique" ON "_UserConversations"("A", "B");
  CREATE INDEX IF NOT EXISTS "_UserConversations_B_index" ON "_UserConversations"("B");
`);

db.exec(`
  INSERT OR IGNORE INTO "HiddenMessage" ("id", "userId", "messageId", "createdAt")
  SELECT "id", "userId", "messageId", "createdAt"
  FROM "MessageDeletion";
`);

const messageColumns = new Set(
  db.prepare(`PRAGMA table_info("Message")`).all().map((column) => column.name),
);

if (!messageColumns.has("deletedForEveryone")) {
  db.exec(
    `ALTER TABLE "Message" ADD COLUMN "deletedForEveryone" BOOLEAN NOT NULL DEFAULT false`,
  );
}

db.close();
