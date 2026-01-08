-- Add company phone and website to Organization
ALTER TABLE "Organization"
ADD COLUMN "phone" TEXT,
ADD COLUMN "website" TEXT;

