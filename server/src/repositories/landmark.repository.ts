import { prisma } from "../config/prisma.js";
import type { LandmarkCategory } from "@prisma/client";

interface CreateLandmarkData {
  name: string;
  description?: string;
  category?: LandmarkCategory;
  latitude: number;
  longitude: number;
  icon?: string;
  image?: string;
  isVisible?: boolean;
  buildingId?: string | null;
  roadNodeId?: string | null;
}

interface UpdateLandmarkData extends Partial<CreateLandmarkData> {}

const BUILDING_SELECT = { select: { id: true, name: true, code: true, entranceRoadNodeId: true } } as const;
const ROAD_NODE_SELECT = { select: { id: true, name: true } } as const;

export class LandmarkRepository {
  async findAll() {
    return prisma.landmark.findMany({
      orderBy: { name: "asc" },
      include: { building: BUILDING_SELECT, roadNode: ROAD_NODE_SELECT },
    });
  }

  async findAllVisible() {
    return prisma.landmark.findMany({
      where: { isVisible: true },
      orderBy: { name: "asc" },
      include: { building: BUILDING_SELECT, roadNode: ROAD_NODE_SELECT },
    });
  }

  async findById(id: string) {
    return prisma.landmark.findUnique({
      where: { id },
      include: { building: BUILDING_SELECT, roadNode: ROAD_NODE_SELECT },
    });
  }

  async findByName(query: string) {
    return prisma.landmark.findMany({
      where: {
        isVisible: true,
        name: { contains: query, mode: "insensitive" },
      },
      orderBy: { name: "asc" },
      take: 10,
      include: { building: BUILDING_SELECT, roadNode: ROAD_NODE_SELECT },
    });
  }

  async findByNameExact(query: string) {
    return prisma.landmark.findMany({
      where: {
        isVisible: true,
        name: { equals: query, mode: "insensitive" },
      },
      take: 5,
      include: { building: BUILDING_SELECT, roadNode: ROAD_NODE_SELECT },
    });
  }

  async create(data: CreateLandmarkData) {
    return prisma.landmark.create({
      data,
      include: { building: BUILDING_SELECT, roadNode: ROAD_NODE_SELECT },
    });
  }

  async update(id: string, data: UpdateLandmarkData) {
    return prisma.landmark.update({
      where: { id },
      data,
      include: { building: BUILDING_SELECT, roadNode: ROAD_NODE_SELECT },
    });
  }

  async delete(id: string) {
    return prisma.landmark.delete({ where: { id } });
  }
}
