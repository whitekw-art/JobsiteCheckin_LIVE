-- Add optional metadata column to CheckInEvent for extra event context
ALTER TABLE "CheckInEvent"
ADD COLUMN "metadata" TEXT;

