-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "planTier" TEXT;
