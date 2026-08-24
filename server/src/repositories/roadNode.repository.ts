import { prisma } from "../config/prisma.js";
import { RoadNodeType } from "@prisma/client";

export interface CreateRoadNodeData {
  name?: string | null;
  type?: RoadNodeType;
  zone?: string | null;
  mapZoom?: number | null;
  latitude: number;
  longitude: number;
}

export interface UpdateRoadNodeData extends Partial<CreateRoadNodeData> {}

const nodeSelectFields = {
  id: true,
  name: true,
  type: true,
  zone: true,
  mapZoom: true,
  latitude: true,
  longitude: true,
};

export class RoadNodeRepository {
  async findAll() {
    return prisma.roadNode.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        outgoingEdges: {
          include: {
            toNode: {
              select: nodeSelectFields,
            },
          },
        },
        incomingEdges: {
          include: {
            fromNode: {
              select: nodeSelectFields,
            },
          },
        },
        buildingEntrances: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.roadNode.findUnique({
      where: { id },
      include: {
        outgoingEdges: {
          include: {
            toNode: {
              select: nodeSelectFields,
            },
          },
        },
        incomingEdges: {
          include: {
            fromNode: {
              select: nodeSelectFields,
            },
          },
        },
        buildingEntrances: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async create(data: CreateRoadNodeData) {
    return prisma.roadNode.create({
      data,
    });
  }

  async update(id: string, data: UpdateRoadNodeData) {
    return prisma.roadNode.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Clean up all connected road edges
      await tx.roadEdge.deleteMany({
        where: {
          OR: [{ fromNodeId: id }, { toNodeId: id }],
        },
      });

      // 2. Unlink any landmarks referencing this road node
      await tx.landmark.updateMany({
        where: { roadNodeId: id },
        data: { roadNodeId: null },
      });

      // 3. Unlink any buildings referencing this road node as entrance
      await tx.building.updateMany({
        where: { entranceRoadNodeId: id },
        data: { entranceRoadNodeId: null },
      });

      // 4. Delete the road node
      return tx.roadNode.delete({
        where: { id },
      });
    });
  }

  async count() {
    return prisma.roadNode.count();
  }
}

