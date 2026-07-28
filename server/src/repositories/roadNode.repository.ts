import { prisma } from "../config/prisma.js";

export interface CreateRoadNodeData {
  name: string;
  latitude: number;
  longitude: number;
}

export interface UpdateRoadNodeData extends Partial<CreateRoadNodeData> {}

export class RoadNodeRepository {
  async findAll() {
    return prisma.roadNode.findMany({
      orderBy: { name: "asc" },
      include: {
        outgoingEdges: {
          include: {
            toNode: {
              select: { id: true, name: true, latitude: true, longitude: true },
            },
          },
        },
        incomingEdges: {
          include: {
            fromNode: {
              select: { id: true, name: true, latitude: true, longitude: true },
            },
          },
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
              select: { id: true, name: true, latitude: true, longitude: true },
            },
          },
        },
        incomingEdges: {
          include: {
            fromNode: {
              select: { id: true, name: true, latitude: true, longitude: true },
            },
          },
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
    return prisma.roadNode.delete({
      where: { id },
    });
  }

  async count() {
    return prisma.roadNode.count();
  }
}
