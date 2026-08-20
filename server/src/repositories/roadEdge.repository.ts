import { prisma } from "../config/prisma.js";

export interface CreateRoadEdgeData {
  fromNodeId: string;
  toNodeId: string;
  distance: number;
  isBidirectional?: boolean;
  isWalkable?: boolean;
}

export interface UpdateRoadEdgeData extends Partial<CreateRoadEdgeData> {}

const nodeSelectFields = {
  id: true,
  name: true,
  type: true,
  zone: true,
  latitude: true,
  longitude: true,
};

export class RoadEdgeRepository {
  async findAll() {
    return prisma.roadEdge.findMany({
      include: {
        fromNode: {
          select: nodeSelectFields,
        },
        toNode: {
          select: nodeSelectFields,
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.roadEdge.findUnique({
      where: { id },
      include: {
        fromNode: {
          select: nodeSelectFields,
        },
        toNode: {
          select: nodeSelectFields,
        },
      },
    });
  }

  async findByNodes(fromNodeId: string, toNodeId: string) {
    return prisma.roadEdge.findFirst({
      where: {
        OR: [
          { fromNodeId, toNodeId },
          { fromNodeId: toNodeId, toNodeId: fromNodeId },
        ],
      },
    });
  }

  async create(data: CreateRoadEdgeData) {
    return prisma.roadEdge.create({
      data: {
        fromNodeId: data.fromNodeId,
        toNodeId: data.toNodeId,
        distance: data.distance,
        isBidirectional: data.isBidirectional ?? true,
        isWalkable: data.isWalkable ?? true,
      },
      include: {
        fromNode: {
          select: nodeSelectFields,
        },
        toNode: {
          select: nodeSelectFields,
        },
      },
    });
  }

  async update(id: string, data: UpdateRoadEdgeData) {
    return prisma.roadEdge.update({
      where: { id },
      data,
      include: {
        fromNode: {
          select: nodeSelectFields,
        },
        toNode: {
          select: nodeSelectFields,
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.roadEdge.delete({
      where: { id },
    });
  }

  async count() {
    return prisma.roadEdge.count();
  }
}

