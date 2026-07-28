import { prisma } from "../config/prisma.js";

export interface CreateRoadEdgeData {
  fromNodeId: string;
  toNodeId: string;
  distance: number;
  isBidirectional?: boolean;
}

export interface UpdateRoadEdgeData extends Partial<CreateRoadEdgeData> {}

export class RoadEdgeRepository {
  async findAll() {
    return prisma.roadEdge.findMany({
      include: {
        fromNode: {
          select: { id: true, name: true, latitude: true, longitude: true },
        },
        toNode: {
          select: { id: true, name: true, latitude: true, longitude: true },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.roadEdge.findUnique({
      where: { id },
      include: {
        fromNode: {
          select: { id: true, name: true, latitude: true, longitude: true },
        },
        toNode: {
          select: { id: true, name: true, latitude: true, longitude: true },
        },
      },
    });
  }

  async findByNodes(fromNodeId: string, toNodeId: string) {
    return prisma.roadEdge.findFirst({
      where: {
        OR: [
          { fromNodeId, toNodeId },
          { fromNodeId: toNodeId, toNodeId: fromNodeId, isBidirectional: true },
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
      },
      include: {
        fromNode: {
          select: { id: true, name: true, latitude: true, longitude: true },
        },
        toNode: {
          select: { id: true, name: true, latitude: true, longitude: true },
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
          select: { id: true, name: true, latitude: true, longitude: true },
        },
        toNode: {
          select: { id: true, name: true, latitude: true, longitude: true },
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
