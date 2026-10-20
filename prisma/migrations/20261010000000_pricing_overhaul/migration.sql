-- Pricing & size overhaul: category table x size + optional framing.
-- Replaces the Plain/Detailed background track, per-product basePrice and
-- per-size priceModifier. Starts from the schema in 0_init (the schema the
-- production database was created with). Existing rows are backfilled before
-- the old columns are dropped, so old products and orders stay readable.

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('PORTRAIT', 'GEOMETRIC', 'MINIMALISTIC', 'FIGURATIVE');

-- CreateEnum
CREATE TYPE "DeliveryZone" AS ENUM ('KADUNA', 'OUTSIDE');

-- AlterEnum (new value is not referenced elsewhere in this migration)
ALTER TYPE "OrderStatus" ADD VALUE 'AWAITING_DEPOSIT';

-- DropIndex (redundant with the unique constraint on slug)
DROP INDEX "Product_slug_idx";

-- ---------------------------------------------------------------------
-- Product: category replaces the Category table, abstractStyle and basePrice.
-- ---------------------------------------------------------------------
ALTER TABLE "Product" ADD COLUMN "category" "ProductCategory" NOT NULL DEFAULT 'PORTRAIT';

UPDATE "Product" SET "category" = CASE
  WHEN "pillar" = 'ABSTRACT' AND "abstractStyle" = 'MINIMALIST' THEN 'MINIMALISTIC'::"ProductCategory"
  WHEN "pillar" = 'ABSTRACT' AND "abstractStyle" = 'FIGURATIVE' THEN 'FIGURATIVE'::"ProductCategory"
  WHEN "pillar" = 'ABSTRACT' THEN 'GEOMETRIC'::"ProductCategory"
  ELSE 'PORTRAIT'::"ProductCategory"
END;

ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";
ALTER TABLE "Product" DROP COLUMN "abstractStyle",
DROP COLUMN "basePrice",
DROP COLUMN "categoryId";

DROP TABLE "Category";
DROP TYPE "AbstractStyle";

CREATE INDEX "Product_category_status_idx" ON "Product"("category", "status");

-- ---------------------------------------------------------------------
-- PortraitSize: prices move to src/lib/pricing.ts; add dimensions.
-- Existing rows get dimensions parsed from labels like "12x16" and sort
-- after the re-seeded 6 sizes (sortOrder 100).
-- ---------------------------------------------------------------------
ALTER TABLE "PortraitSize"
ADD COLUMN "heightIn" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN "widthIn" INTEGER NOT NULL DEFAULT 0;

UPDATE "PortraitSize" SET
  "widthIn" = COALESCE(NULLIF(substring("label" from '^(\d+)'), '')::INTEGER, 0),
  "heightIn" = COALESCE(NULLIF(substring("label" from '(\d+)$'), '')::INTEGER, 0);

ALTER TABLE "PortraitSize" ALTER COLUMN "widthIn" DROP DEFAULT,
ALTER COLUMN "heightIn" DROP DEFAULT,
ALTER COLUMN "sortOrder" SET DEFAULT 0;

ALTER TABLE "PortraitSize" DROP COLUMN "priceModifier";

-- ---------------------------------------------------------------------
-- OrderItem: snapshot size/framing/price. Backfill from the old size and
-- track, keeping the old background choice visible in the item notes.
-- ---------------------------------------------------------------------
ALTER TABLE "OrderItem"
ADD COLUMN "framed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sizeIndex" INTEGER,
ADD COLUMN "sizeLabel" TEXT,
ADD COLUMN "subjectCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "unitPrice" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "subtotal" SET DEFAULT 0;

UPDATE "OrderItem" oi SET "sizeLabel" = ps."label"
FROM "PortraitSize" ps WHERE oi."sizeId" = ps."id";

UPDATE "OrderItem" SET "sizeIndex" = CASE lower(replace("sizeLabel", '×', 'x'))
  WHEN '8x12' THEN 0
  WHEN '12x16' THEN 1
  WHEN '16x20' THEN 2
  WHEN '20x24' THEN 3
  WHEN '20x30' THEN 4
  WHEN '24x36' THEN 5
  ELSE NULL
END
WHERE "sizeLabel" IS NOT NULL;

UPDATE "OrderItem" SET "unitPrice" = "subtotal" / GREATEST("quantity", 1);

UPDATE "OrderItem" oi SET "notes" = trim(both ' ' from concat_ws(' ', oi."notes", '[Background: ' || bt."label" || ']'))
FROM "BackgroundTrack" bt WHERE oi."backgroundTrackId" = bt."id";

ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_backgroundTrackId_fkey";
ALTER TABLE "OrderItem" DROP COLUMN "backgroundTrackId";

DROP TABLE "BackgroundTrack";

-- ---------------------------------------------------------------------
-- Order: totalAmount -> total, plus delivery, subtotal and deposit.
-- Old totals are kept as-is.
-- ---------------------------------------------------------------------
ALTER TABLE "Order" RENAME COLUMN "totalAmount" TO "total";

ALTER TABLE "Order"
ADD COLUMN "delivery" "DeliveryZone" NOT NULL DEFAULT 'KADUNA',
ADD COLUMN "deliveryFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "deposit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "subtotal" INTEGER NOT NULL DEFAULT 0;

UPDATE "Order" SET "subtotal" = "total", "deposit" = "total" / 2;
