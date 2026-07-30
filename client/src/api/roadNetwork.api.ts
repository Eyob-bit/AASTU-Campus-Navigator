import { apiClient } from "./client";


export interface RoadNode {
  id: string;
  name: string | null;
  type: string;
  zone: string | null;
  latitude: number;
  longitude: number;
  mapZoom?: number | null;
  createdAt?: string;
  updatedAt?: string;
  outgoingEdges?: RoadEdge[];
  incomingEdges?: RoadEdge[];
  buildingEntrances?: { id: string; name: string; code: string }[];
}

export interface RoadEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distance: number;
  isBidirectional: boolean;
  isWalkable: boolean;
  fromNode?: RoadNode;
  toNode?: RoadNode;
  createdAt?: string;
}

export interface RouteNodeInfo {
  id: string;
  name: string | null;
  type: string;
  zone: string | null;
  latitude: number;
  longitude: number;
  buildingId?: string | null;
  buildingName?: string | null;
}

export type InstructionType =
  | "START"
  | "STRAIGHT"
  | "LEFT"
  | "RIGHT"
  | "SLIGHT_LEFT"
  | "SLIGHT_RIGHT"
  | "UTURN"
  | "ARRIVE";

export interface RouteInstruction {
  type: InstructionType;
  text: string;
  distance: number;
  targetNodeId?: string;
  targetNodeName?: string | null;
}

export interface RouteResponse {
  coordinates: [number, number][];
  totalDistanceMeters: number;
  estimatedWalkingMinutes: number;
  startNode: RouteNodeInfo;
  destNode: RouteNodeInfo;
  pathNodes: RouteNodeInfo[];
  instructions: RouteInstruction[];
}

export const roadNetworkApi = {
  // Road Nodes
  async getNodes(): Promise<RoadNode[]> {
    const res = await apiClient.get<{ success: boolean; nodes: RoadNode[] }>("/road-nodes");
    return res.data.nodes;
  },

  async createNode(data: { name: string; latitude: number; longitude: number }): Promise<RoadNode> {
    const res = await apiClient.post<{ success: boolean; node: RoadNode }>("/road-nodes", data);
    return res.data.node;
  },

  async updateNode(id: string, data: Partial<{ name: string; latitude: number; longitude: number }>): Promise<RoadNode> {
    const res = await apiClient.patch<{ success: boolean; node: RoadNode }>(`/road-nodes/${id}`, data);
    return res.data.node;
  },

  async deleteNode(id: string): Promise<void> {
    await apiClient.delete(`/road-nodes/${id}`);
  },

  // Road Edges
  async getEdges(): Promise<RoadEdge[]> {
    const res = await apiClient.get<{ success: boolean; edges: RoadEdge[] }>("/road-edges");
    return res.data.edges;
  },

  async createEdge(data: { fromNodeId: string; toNodeId: string; distance?: number; isBidirectional?: boolean }): Promise<RoadEdge> {
    const res = await apiClient.post<{ success: boolean; edge: RoadEdge }>("/road-edges", data);
    return res.data.edge;
  },

  async updateEdge(id: string, data: Partial<{ distance: number; isBidirectional: boolean }>): Promise<RoadEdge> {
    const res = await apiClient.patch<{ success: boolean; edge: RoadEdge }>(`/road-edges/${id}`, data);
    return res.data.edge;
  },

  async deleteEdge(id: string): Promise<void> {
    await apiClient.delete(`/road-edges/${id}`);
  },

  // A* Navigation Route Calculation
  async calculateRoute(data: {
    startLat: number;
    startLng: number;
    destLat?: number;
    destLng?: number;
    destNodeId?: string;
  }): Promise<RouteResponse> {
    const res = await apiClient.post<{ success: boolean; route: RouteResponse }>("/navigation/route", data);
    return res.data.route;
  },
};

