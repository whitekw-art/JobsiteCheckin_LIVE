-- Create table for check-in events (e.g., PAGE_VIEW)
CREATE TABLE "CheckInEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "checkInId" UUID NOT NULL,
  "eventType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CheckInEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CheckInEvent"
ADD CONSTRAINT "CheckInEvent_checkInId_fkey"
FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

