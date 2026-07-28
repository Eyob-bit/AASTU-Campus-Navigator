-- CreateEnum (if not exists)
DO $$ BEGIN
  CREATE TYPE "LandmarkCategory" AS ENUM ('FOOD', 'EDUCATION', 'SPORTS', 'ADMINISTRATION', 'TRANSPORT', 'EMERGENCY', 'RECREATION', 'RELIGIOUS', 'SERVICES', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable: add missing columns to PanoramaScene
ALTER TABLE "PanoramaScene"
  ADD COLUMN IF NOT EXISTS "imageFilename" TEXT;

-- AlterIndex: SearchAlias (drop old indexes, add new unique ones)
DROP INDEX IF EXISTS "SearchAlias_alias_officeId_key";
DROP INDEX IF EXISTS "SearchAlias_alias_staffId_key";
DROP INDEX IF EXISTS "SearchAlias_normalizedAlias_idx";

DO $$ BEGIN
  CREATE UNIQUE INDEX "SearchAlias_normalizedAlias_officeId_key" ON "SearchAlias"("normalizedAlias", "officeId");
EXCEPTION WHEN duplicate_table THEN null; END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX "SearchAlias_normalizedAlias_staffId_key" ON "SearchAlias"("normalizedAlias", "staffId");
EXCEPTION WHEN duplicate_table THEN null; END $$;

-- Unique indexes on PanoramaScene and SceneElement
DO $$ BEGIN
  CREATE UNIQUE INDEX "PanoramaScene_floorId_displayOrder_key" ON "PanoramaScene"("floorId", "displayOrder");
EXCEPTION WHEN duplicate_table THEN null; END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX "SceneElement_sceneId_displayOrder_key" ON "SceneElement"("sceneId", "displayOrder");
EXCEPTION WHEN duplicate_table THEN null; END $$;

-- CreateTable: Landmark (with optional buildingId FK)
CREATE TABLE IF NOT EXISTS "Landmark" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "category"    "LandmarkCategory" NOT NULL DEFAULT 'CUSTOM',
    "latitude"    DOUBLE PRECISION NOT NULL,
    "longitude"   DOUBLE PRECISION NOT NULL,
    "icon"        TEXT,
    "image"       TEXT,
    "isVisible"   BOOLEAN NOT NULL DEFAULT true,
    "buildingId"  TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Landmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Landmark_category_idx" ON "Landmark"("category");
CREATE INDEX IF NOT EXISTS "Landmark_name_idx" ON "Landmark"("name");
CREATE INDEX IF NOT EXISTS "Landmark_buildingId_idx" ON "Landmark"("buildingId");

-- AddForeignKey: Landmark.buildingId -> Building.id
DO $$ BEGIN
  ALTER TABLE "Landmark" ADD CONSTRAINT "Landmark_buildingId_fkey"
    FOREIGN KEY ("buildingId") REFERENCES "Building"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

