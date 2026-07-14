/*
  Warnings:

  - You are about to drop the column `latitude` on the `Building` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Building` table. All the data in the column will be lost.
  - Added the required column `entranceLatitude` to the `Building` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entranceLongitude` to the `Building` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SceneElement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Building" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "entranceLatitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "entranceLongitude" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "PanoramaScene" ADD COLUMN     "isEntryScene" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SceneElement" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
