-- Add isPublic flag to CheckIn table
ALTER TABLE "CheckIn"
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

