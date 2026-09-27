-- Sign-In & Security (Account → General)
-- Run on BOTH staging and production, per the standing dual-environment rule.
-- Purely additive: two new tables, nothing altered on existing ones.

CREATE TABLE IF NOT EXISTS "UserEmail" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "email"      TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserEmail_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PendingEmailChange" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "newEmail"  TEXT NOT NULL,
    "purpose"   TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PendingEmailChange_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserEmail_email_key"        ON "UserEmail"("email");
CREATE INDEX        IF NOT EXISTS "UserEmail_userId_idx"       ON "UserEmail"("userId");
CREATE INDEX        IF NOT EXISTS "PendingEmailChange_userId_idx"    ON "PendingEmailChange"("userId");
CREATE INDEX        IF NOT EXISTS "PendingEmailChange_expiresAt_idx" ON "PendingEmailChange"("expiresAt");

ALTER TABLE "UserEmail"
  ADD CONSTRAINT "UserEmail_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PendingEmailChange"
  ADD CONSTRAINT "PendingEmailChange_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
