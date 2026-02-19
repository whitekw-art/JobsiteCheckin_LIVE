-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "slug" TEXT;

-- Backfill slugs from org name
UPDATE "Organization"
SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
WHERE "slug" IS NULL;

-- Handle collisions by appending '-' + id prefix
UPDATE "Organization" o
SET "slug" = o."slug" || '-' || LEFT(o."id", 4)
WHERE o."slug" IN (
  SELECT "slug" FROM "Organization" GROUP BY "slug" HAVING COUNT(*) > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
