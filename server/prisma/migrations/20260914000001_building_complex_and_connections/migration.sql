-- CreateEnum (if not exists)
DO $$ BEGIN
  CREATE TYPE "ConnectionType" AS ENUM ('BRIDGE', 'WALKWAY', 'SKYWALK', 'TUNNEL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: BuildingComplex
CREATE TABLE IF NOT EXISTS "BuildingComplex" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "zone" TEXT,
    "coverImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildingComplex_pkey" PRIMARY KEY ("id")
);

-- Unique index on BuildingComplex code
DO $$ BEGIN
  CREATE UNIQUE INDEX "BuildingComplex_code_key" ON "BuildingComplex"("code");
EXCEPTION WHEN duplicate_table THEN null; END $$;

-- Index on BuildingComplex name
CREATE INDEX IF NOT EXISTS "BuildingComplex_name_idx" ON "BuildingComplex"("name");

-- AlterTable: Building add complexId
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "complexId" TEXT;

-- Index on Building complexId
CREATE INDEX IF NOT EXISTS "Building_complexId_idx" ON "Building"("complexId");

-- AddForeignKey: Building.complexId -> BuildingComplex.id
DO $$ BEGIN
  ALTER TABLE "Building" ADD CONSTRAINT "Building_complexId_fkey"
    FOREIGN KEY ("complexId") REFERENCES "BuildingComplex"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable: BuildingEntrance
CREATE TABLE IF NOT EXISTS "BuildingEntrance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "roadNodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildingEntrance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BuildingEntrance_buildingId_idx" ON "BuildingEntrance"("buildingId");
CREATE INDEX IF NOT EXISTS "BuildingEntrance_roadNodeId_idx" ON "BuildingEntrance"("roadNodeId");

-- AddForeignKey: BuildingEntrance.buildingId -> Building.id
DO $$ BEGIN
  ALTER TABLE "BuildingEntrance" ADD CONSTRAINT "BuildingEntrance_buildingId_fkey"
    FOREIGN KEY ("buildingId") REFERENCES "Building"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey: BuildingEntrance.roadNodeId -> RoadNode.id
DO $$ BEGIN
  ALTER TABLE "BuildingEntrance" ADD CONSTRAINT "BuildingEntrance_roadNodeId_fkey"
    FOREIGN KEY ("roadNodeId") REFERENCES "RoadNode"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable: BlockConnection
CREATE TABLE IF NOT EXISTS "BlockConnection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ConnectionType" NOT NULL DEFAULT 'BRIDGE',
    "fromBuildingId" TEXT NOT NULL,
    "toBuildingId" TEXT NOT NULL,
    "fromFloorId" TEXT,
    "toFloorId" TEXT,
    "fromSceneId" TEXT,
    "toSceneId" TEXT,
    "description" TEXT,
    "isWalkable" BOOLEAN NOT NULL DEFAULT true,
    "complexId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockConnection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BlockConnection_fromBuildingId_idx" ON "BlockConnection"("fromBuildingId");
CREATE INDEX IF NOT EXISTS "BlockConnection_toBuildingId_idx" ON "BlockConnection"("toBuildingId");
CREATE INDEX IF NOT EXISTS "BlockConnection_complexId_idx" ON "BlockConnection"("complexId");

-- Foreign keys for BlockConnection
DO $$ BEGIN
  ALTER TABLE "BlockConnection" ADD CONSTRAINT "BlockConnection_fromBuildingId_fkey"
    FOREIGN KEY ("fromBuildingId") REFERENCES "Building"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BlockConnection" ADD CONSTRAINT "BlockConnection_toBuildingId_fkey"
    FOREIGN KEY ("toBuildingId") REFERENCES "Building"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BlockConnection" ADD CONSTRAINT "BlockConnection_fromFloorId_fkey"
    FOREIGN KEY ("fromFloorId") REFERENCES "Floor"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BlockConnection" ADD CONSTRAINT "BlockConnection_toFloorId_fkey"
    FOREIGN KEY ("toFloorId") REFERENCES "Floor"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BlockConnection" ADD CONSTRAINT "BlockConnection_fromSceneId_fkey"
    FOREIGN KEY ("fromSceneId") REFERENCES "PanoramaScene"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BlockConnection" ADD CONSTRAINT "BlockConnection_toSceneId_fkey"
    FOREIGN KEY ("toSceneId") REFERENCES "PanoramaScene"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "BlockConnection" ADD CONSTRAINT "BlockConnection_complexId_fkey"
    FOREIGN KEY ("complexId") REFERENCES "BuildingComplex"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
