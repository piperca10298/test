CREATE TABLE IF NOT EXISTS "HiddenMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HiddenMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HiddenMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "HiddenMessage_userId_messageId_key"
ON "HiddenMessage"("userId", "messageId");

CREATE INDEX IF NOT EXISTS "HiddenMessage_userId_idx"
ON "HiddenMessage"("userId");

CREATE INDEX IF NOT EXISTS "HiddenMessage_messageId_idx"
ON "HiddenMessage"("messageId");

INSERT OR IGNORE INTO "HiddenMessage" ("id", "userId", "messageId", "createdAt")
SELECT "id", "userId", "messageId", "createdAt"
FROM "MessageDeletion";
