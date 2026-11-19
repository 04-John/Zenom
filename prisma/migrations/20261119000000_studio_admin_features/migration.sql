-- Studio admin features (step 2 of the mobile handoff follow-up).
-- Additive only: new enums, nullable columns, columns with defaults and two
-- new tables. Nothing is dropped or rewritten, so the code that is live
-- before this deploy keeps working against the migrated database.
--
--  User.sessionVersion         sign out other devices after a password change
--  Product.featured            "Show on home page" (home hero slideshow)
--  Order.neededBy              commission "needed by" date (was in notes)
--  OrderItem.medium / referencePhotoUrl   commission details (were in notes)
--  Order.quoteAcceptedAt / customerPaidAt / sketchApprovedAt /
--    sketchFeedback(At)        the customer's taps in the app (flags only)
--  Order.deliveredAt           delivery date on the certificate
--  OrderPhoto                  sketch / shading / finished progress photos
--  StudioSettings              bank details, quote and drawing times

-- CreateEnum
CREATE TYPE "Medium" AS ENUM ('CHARCOAL', 'GRAPHITE', 'COLOUR_PENCIL');

-- CreateEnum
CREATE TYPE "PhotoStage" AS ENUM ('SKETCH', 'SHADING', 'FINISHED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerPaidAt" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "neededBy" DATE,
ADD COLUMN     "quoteAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "sketchApprovedAt" TIMESTAMP(3),
ADD COLUMN     "sketchFeedback" TEXT,
ADD COLUMN     "sketchFeedbackAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "medium" "Medium",
ADD COLUMN     "referencePhotoUrl" TEXT;

-- CreateTable
CREATE TABLE "OrderPhoto" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stage" "PhotoStage" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioSettings" (
    "id" TEXT NOT NULL DEFAULT 'studio',
    "bankName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "quoteHours" INTEGER NOT NULL DEFAULT 24,
    "drawingDays" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderPhoto_orderId_stage_idx" ON "OrderPhoto"("orderId", "stage");

-- CreateIndex
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

-- AddForeignKey
ALTER TABLE "OrderPhoto" ADD CONSTRAINT "OrderPhoto_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill: orders already completed get their last update as the delivery
-- date (the closest record we have of when they were marked delivered).
UPDATE "Order" SET "deliveredAt" = "updatedAt" WHERE "status" = 'COMPLETED' AND "deliveredAt" IS NULL;
