import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { Marker, type GeoJSONSource, type MapMouseEvent, type FilterSpecification } from "maplibre-gl";
import {
  MapPin, Trash2, RefreshCw, Compass, Link2, X, ArrowRightLeft, Waypoints,
} from "lucide-react";
import {
  Card, ConfirmDialog, ToastContainer, Button, ErrorBanner,
} from "@/components/ui";
import { roadNetworkApi, type RoadNode, type RoadEdge } from "@/api/roadNetwork.api";
import { useToast } from "@/hooks/useToast";
import {
  MapLibreContainer,
  useMapInstance,
  CampusBoundaryPolygon,
  AASTU_CENTER_LNG_LAT,
  DEFAULT_ZOOM,
  type TileMode,
} from "@/components/map";
import { calculateDistanceInMeters } from "@/utils/geo";

// ── Interactive MapLibre Road Network Edges Layer ─────────────────────────
interface RoadEdgesLayerProps {
  edges: RoadEdge[];
  nodeMap: Map<string, RoadNode>;
  selectedEdgeId: string | null;
  onSelectEdge: (edge: RoadEdge) => void;
}

function RoadEdgesLayer({ edges, nodeMap, selectedEdgeId, onSelectEdge }: RoadEdgesLayerProps) {
  const map = useMapInstance();
  const onSelectEdgeRef = useRef(onSelectEdge);
  useEffect(() => {
    onSelectEdgeRef.current = onSelectEdge;
  }, [onSelectEdge]);

  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.LineString>>(() => {
    const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    edges.forEach((edge) => {
      const u = edge.fromNode ?? nodeMap.get(edge.fromNodeId);
      const v = edge.toNode ?? nodeMap.get(edge.toNodeId);
      if (!u || !v) return;
      const uLng = Number(u.longitude), uLat = Number(u.latitude);
      const vLng = Number(v.longitude), vLat = Number(v.latitude);
      if (isNaN(uLng) || isNaN(uLat) || isNaN(vLng) || isNaN(vLat)) return;
      if (uLat === 0 && uLng === 0) return;
      features.push({
        type: "Feature",
        properties: {
          id: edge.id,
          isBidirectional: edge.isBidirectional,
          distance: edge.distance,
          fromNodeId: edge.fromNodeId,
          toNodeId: edge.toNodeId,
        },
        geometry: { type: "LineString", coordinates: [[uLng, uLat], [vLng, vLat]] },
      });
    });
    return { type: "FeatureCollection", features };
  }, [edges, nodeMap]);

  useEffect(() => {
    if (!map) return;

    const SOURCE_ID = "road-edges-source";
    const LAYER_CASING = "road-edges-casing";
    const LAYER_GLOW = "road-edges-glow";
    const LAYER_LINE = "road-edges-line";
    const LAYER_SELECTED_GLOW = "road-edges-selected-glow";
    const LAYER_SELECTED_LINE = "road-edges-selected-line";
    const LAYER_HITBOX = "road-edges-hitbox";

    function applyData() {
      if (!map) return;

      try {
        const existingSource = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
        if (existingSource) {
          existingSource.setData(geojson);
        } else {
          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: geojson,
          });

          // 1. Dark casing background
          if (!map.getLayer(LAYER_CASING)) {
            map.addLayer({
              id: LAYER_CASING,
              type: "line",
              source: SOURCE_ID,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": "#020617", "line-width": 8, "line-opacity": 0.9 },
            });
          }

          // 2. Cyan ambient glow
          if (!map.getLayer(LAYER_GLOW)) {
            map.addLayer({
              id: LAYER_GLOW,
              type: "line",
              source: SOURCE_ID,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": "#06b6d4", "line-width": 6, "line-opacity": 0.6, "line-blur": 2 },
            });
          }

          // 3. Normal cyan route line
          if (!map.getLayer(LAYER_LINE)) {
            map.addLayer({
              id: LAYER_LINE,
              type: "line",
              source: SOURCE_ID,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": "#22d3ee", "line-width": 3.5, "line-opacity": 1.0 },
            });
          }

          // 4. Selected edge glow highlight
          if (!map.getLayer(LAYER_SELECTED_GLOW)) {
            map.addLayer({
              id: LAYER_SELECTED_GLOW,
              type: "line",
              source: SOURCE_ID,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": "#f59e0b",
                "line-width": 10,
                "line-opacity": 0.85,
                "line-blur": 3,
              },
              filter: ["==", ["get", "id"], selectedEdgeId || ""],
            });
          }

          // 5. Selected edge bright core
          if (!map.getLayer(LAYER_SELECTED_LINE)) {
            map.addLayer({
              id: LAYER_SELECTED_LINE,
              type: "line",
              source: SOURCE_ID,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": "#fbbf24",
                "line-width": 5,
                "line-opacity": 1.0,
              },
              filter: ["==", ["get", "id"], selectedEdgeId || ""],
            });
          }

          // 6. Transparent wide hit-detection layer for easy clicking and hover
          if (!map.getLayer(LAYER_HITBOX)) {
            map.addLayer({
              id: LAYER_HITBOX,
              type: "line",
              source: SOURCE_ID,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": "#ffffff",
                "line-width": 22,
                "line-opacity": 0.001,
              },
            });
          }
        }
      } catch {
        // Style load will fire and call applyData
      }
    }

    applyData();
    map.on("style.load", applyData);
    map.on("styledata", applyData);

    const handleEdgeClick = (e: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
      if (!e.features || e.features.length === 0) return;
      (e.originalEvent as unknown as { _edgeHandled: boolean })._edgeHandled = true;
      const edgeId = e.features[0].properties?.id as string | undefined;
      if (edgeId) {
        const found = edges.find((ed) => ed.id === edgeId);
        if (found) {
          onSelectEdgeRef.current(found);
        }
      }
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", LAYER_HITBOX, handleEdgeClick);
    map.on("mouseenter", LAYER_HITBOX, handleMouseEnter);
    map.on("mouseleave", LAYER_HITBOX, handleMouseLeave);

    return () => {
      map.off("style.load", applyData);
      map.off("styledata", applyData);
      map.off("click", LAYER_HITBOX, handleEdgeClick);
      map.off("mouseenter", LAYER_HITBOX, handleMouseEnter);
      map.off("mouseleave", LAYER_HITBOX, handleMouseLeave);
    };
  }, [map, geojson, edges]);

  // Update selected edge filter dynamically
  useEffect(() => {
    if (!map) return;
    try {
      const filter = ["==", ["get", "id"], selectedEdgeId || ""] as unknown as FilterSpecification;
      if (map.getLayer("road-edges-selected-glow")) {
        map.setFilter("road-edges-selected-glow", filter);
      }
      if (map.getLayer("road-edges-selected-line")) {
        map.setFilter("road-edges-selected-line", filter);
      }
    } catch {
      // Ignore if layers not yet mounted
    }
  }, [map, selectedEdgeId]);

  return null;
}

// ── MapLibre Road Node Marker ──────────────────────────────────────────────────
interface RoadNodeMarkerProps {
  node: RoadNode;
  isSelected: boolean;
  isConnectSource: boolean;
  isDraggable: boolean;
  onNodeClick: (node: RoadNode) => void;
  onDragEnd: (node: RoadNode, lat: number, lng: number) => void;
}

const RoadNodeMarker = memo(function RoadNodeMarker({
  node,
  isSelected,
  isConnectSource,
  isDraggable,
  onNodeClick,
  onDragEnd,
}: RoadNodeMarkerProps) {
  const map = useMapInstance();
  const markerRef = useRef<Marker | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const onNodeClickRef = useRef(onNodeClick);
  const onDragEndRef = useRef(onDragEnd);

  useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);
  useEffect(() => { onDragEndRef.current = onDragEnd; }, [onDragEnd]);

  const color = isConnectSource
    ? "#f59e0b"
    : isSelected
    ? "#06b6d4"
    : isDraggable
    ? "#a78bfa"
    : "#3b82f6";
  const size = isConnectSource ? 22 : isSelected ? 20 : 16;

  // Initialize marker once per node ID
  useEffect(() => {
    if (!map) return;

    const el = document.createElement("div");
    elementRef.current = el;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.backgroundColor = color;
    el.style.border = isConnectSource ? "3px solid #ffffff" : isSelected ? "3px solid #ffffff" : "2px solid white";
    el.style.borderRadius = "50%";
    el.style.boxShadow = isConnectSource
      ? "0 0 14px 4px rgba(245, 158, 11, 0.95)"
      : isSelected
      ? "0 0 14px 4px rgba(6, 182, 212, 0.95)"
      : `0 0 8px ${color}88`;
    el.style.cursor = isDraggable ? "move" : "pointer";
    el.style.transition = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";

    const marker = new Marker({
      element: el,
      draggable: isDraggable,
    })
      .setLngLat([node.longitude, node.latitude])
      .addTo(map);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      (e as unknown as { _nodeHandled: boolean })._nodeHandled = true;
      onNodeClickRef.current?.(node);
    });

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      onDragEndRef.current?.(node, pos.lat, pos.lng);
    });

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, node.id]);

  // Update styles & position dynamically without remounting DOM elements
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([node.longitude, node.latitude]);
      markerRef.current.setDraggable(isDraggable);
    }
    if (elementRef.current) {
      elementRef.current.style.width = `${size}px`;
      elementRef.current.style.height = `${size}px`;
      elementRef.current.style.backgroundColor = color;
      elementRef.current.style.border = isConnectSource
        ? "3px solid #ffffff"
        : isSelected
        ? "3px solid #ffffff"
        : "2px solid white";
      elementRef.current.style.boxShadow = isConnectSource
        ? "0 0 14px 4px rgba(245, 158, 11, 0.95)"
        : isSelected
        ? "0 0 14px 4px rgba(6, 182, 212, 0.95)"
        : `0 0 8px ${color}88`;
      elementRef.current.style.cursor = isDraggable ? "move" : "pointer";
    }
  }, [node.latitude, node.longitude, color, size, isDraggable, isConnectSource, isSelected]);

  return null;
});

// ── Main RoadNetworkPage Component ───────────────────────────────────────────
export function RoadNetworkPage() {
  const { toasts, addToast, removeToast } = useToast();

  const [nodes, setNodes] = useState<RoadNode[]>([]);
  const [edges, setEdges] = useState<RoadEdge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"map" | "nodes" | "edges">("map");
  const [tileMode, setTileMode] = useState<TileMode>("street");

  // Selection state
  const [selectedNode, setSelectedNode] = useState<RoadNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<RoadEdge | null>(null);
  const [connectSourceNode, setConnectSourceNode] = useState<RoadNode | null>(null);
  const [connectModeActive, setConnectModeActive] = useState<boolean>(false);
  const [isModifierPressed, setIsModifierPressed] = useState<boolean>(false);
  const [dragModeActive, setDragModeActive] = useState<boolean>(false);

  // Modals state
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [newLatLng, setNewLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [nodeName, setNodeName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "node" | "edge";
    id: string;
    name: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track Shift or Control key press for dragging nodes
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Shift" || e.key === "Control") {
        setIsModifierPressed(true);
      }
      if (e.key === "Escape") {
        setSelectedNode(null);
        setSelectedEdge(null);
        setConnectSourceNode(null);
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === "Shift" || e.key === "Control") {
        setIsModifierPressed(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedNodes, fetchedEdges] = await Promise.all([
        roadNetworkApi.getNodes(),
        roadNetworkApi.getEdges(),
      ]);
      setNodes(fetchedNodes);
      setEdges(fetchedEdges);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load road network.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    const rawEvent = e.originalEvent as unknown as { _edgeHandled?: boolean; _nodeHandled?: boolean };
    if (rawEvent._edgeHandled || rawEvent._nodeHandled) {
      return;
    }

    if (connectSourceNode) {
      setConnectSourceNode(null);
      return;
    }

    // Deselect any open item on background map click
    setSelectedNode(null);
    setSelectedEdge(null);

    // If not in drag mode, open add node dialog
    if (!dragModeActive && !isModifierPressed) {
      setNewLatLng({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      setNodeName(`Waypoint ${nodes.length + 1}`);
      setNodeModalOpen(true);
    }
  }, [connectSourceNode, dragModeActive, isModifierPressed, nodes.length]);

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLatLng || !nodeName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await roadNetworkApi.createNode({
        name: nodeName.trim(),
        latitude: newLatLng.lat,
        longitude: newLatLng.lng,
      });
      setNodes((prev) => [...prev, created]);
      addToast({ type: "success", message: `Road node "${created.name}" created.` });
      setNodeModalOpen(false);
      setNewLatLng(null);
      setNodeName("");
      setSelectedNode(created);
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to create node." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNodeClick = useCallback(async (node: RoadNode) => {
    setSelectedEdge(null);

    if (connectSourceNode) {
      if (connectSourceNode.id === node.id) {
        setConnectSourceNode(null);
        return;
      }

      // Check if connection already exists between these two nodes
      const alreadyExists = edges.some(
        (e) =>
          (e.fromNodeId === connectSourceNode.id && e.toNodeId === node.id) ||
          (e.fromNodeId === node.id && e.toNodeId === connectSourceNode.id)
      );

      if (alreadyExists) {
        addToast({
          type: "info",
          message: `⚠️ Connection already exists between "${connectSourceNode.name ?? "Node"}" and "${node.name ?? "Node"}".`,
        });
        setConnectSourceNode(null);
        return;
      }

      try {
        const dist = calculateDistanceInMeters(
          connectSourceNode.latitude,
          connectSourceNode.longitude,
          node.latitude,
          node.longitude
        );

        const newEdge = await roadNetworkApi.createEdge({
          fromNodeId: connectSourceNode.id,
          toNodeId: node.id,
          distance: dist,
          isBidirectional: true,
        });

        // Ensure full node objects are attached for immediate GeoJSON line rendering
        const fullEdge: RoadEdge = {
          ...newEdge,
          fromNode: connectSourceNode,
          toNode: node,
          fromNodeId: connectSourceNode.id,
          toNodeId: node.id,
          distance: dist,
          isBidirectional: true,
          isWalkable: true,
        };

        setEdges((prev) => [...prev, fullEdge]);
        setSelectedEdge(fullEdge);
        addToast({
          type: "success",
          message: `Connected "${connectSourceNode.name ?? "Node"}" ↔ "${node.name ?? "Node"}" (${Math.round(dist)}m).`,
        });
      } catch (err: unknown) {
        addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to create connection." });
      } finally {
        setConnectSourceNode(null);
      }
    } else if (connectModeActive) {
      setConnectSourceNode(node);
      addToast({
        type: "info",
        message: `Selected "${node.name ?? "Node"}" as start. Click a second node to connect.`,
      });
    } else {
      setSelectedNode(node);
    }
  }, [connectSourceNode, connectModeActive, edges, addToast]);

  const handleSelectEdge = useCallback((edge: RoadEdge) => {
    setSelectedNode(null);
    setConnectSourceNode(null);
    setSelectedEdge(edge);
  }, []);

  const handleMarkerDragEnd = useCallback(async (node: RoadNode, newLat: number, newLng: number) => {
    setNodes((prevNodes) =>
      prevNodes.map((n) => (n.id === node.id ? { ...n, latitude: newLat, longitude: newLng } : n))
    );

    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        if (edge.fromNodeId === node.id || edge.toNodeId === node.id) {
          const uNode = edge.fromNodeId === node.id ? { latitude: newLat, longitude: newLng } : nodeMap.get(edge.fromNodeId);
          const vNode = edge.toNodeId === node.id ? { latitude: newLat, longitude: newLng } : nodeMap.get(edge.toNodeId);
          if (uNode && vNode) {
            const newDist = calculateDistanceInMeters(uNode.latitude, uNode.longitude, vNode.latitude, vNode.longitude);
            roadNetworkApi.updateEdge(edge.id, { distance: newDist }).catch(() => { });
            return { ...edge, distance: newDist };
          }
        }
        return edge;
      })
    );

    try {
      await roadNetworkApi.updateNode(node.id, { latitude: newLat, longitude: newLng });
      addToast({
        type: "success",
        message: `Moved "${node.name}" to (${newLat.toFixed(5)}°, ${newLng.toFixed(5)}°).`,
      });
    } catch {
      addToast({ type: "error", message: "Failed to update node position on server." });
      loadData();
    }
  }, [nodeMap, addToast, loadData]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      if (deleteTarget.type === "node") {
        await roadNetworkApi.deleteNode(deleteTarget.id);
        setNodes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
        setEdges((prev) => prev.filter((e) => e.fromNodeId !== deleteTarget.id && e.toNodeId !== deleteTarget.id));
        if (selectedNode?.id === deleteTarget.id) setSelectedNode(null);
        if (connectSourceNode?.id === deleteTarget.id) setConnectSourceNode(null);
        addToast({ type: "success", message: `Deleted node "${deleteTarget.name}".` });
      } else {
        await roadNetworkApi.deleteEdge(deleteTarget.id);
        setEdges((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        if (selectedEdge?.id === deleteTarget.id) setSelectedEdge(null);
        addToast({ type: "success", message: `Deleted road connection.` });
      }
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Delete failed." });
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Compass className="text-cyan-600 dark:text-cyan-400" size={18} />
            Road Network Editor
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {nodes.length} nodes · {edges.length} road connections inside AASTU campus
          </p>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === "map" ? "bg-cyan-600 dark:bg-cyan-500 text-white shadow-md" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Interactive Map
            </button>
            <button
              onClick={() => setViewMode("nodes")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === "nodes" ? "bg-cyan-600 dark:bg-cyan-500 text-white shadow-md" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Road Nodes ({nodes.length})
            </button>
            <button
              onClick={() => setViewMode("edges")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === "edges" ? "bg-cyan-600 dark:bg-cyan-500 text-white shadow-md" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Connections ({edges.length})
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      <ErrorBanner title="Road network error" message={error} onRetry={loadData} />

      {/* Main View Mode Content */}
      {viewMode === "map" && (
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Instructions banner */}
          <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-300 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connectSourceNode || connectModeActive || isModifierPressed || dragModeActive ? "bg-amber-400 animate-ping" : "bg-cyan-400 animate-pulse"}`} />
              <span>
                {connectSourceNode ? (
                  <strong className="text-amber-400 font-bold">
                    🔗 Click a target node to connect with "{connectSourceNode.name ?? "Source Node"}"
                  </strong>
                ) : connectModeActive ? (
                  <strong className="text-cyan-300 font-bold">
                    🔗 CONNECT MODE ACTIVE — Click start node, then destination node to connect them.
                  </strong>
                ) : isModifierPressed || dragModeActive ? (
                  <strong className="text-amber-300 font-bold">
                    🎯 DRAG MODE ACTIVE — Click and drag any waypoint node to move its location.
                  </strong>
                ) : (
                  <>
                    Click map to add node · Click any <strong className="text-cyan-300">Node</strong> or <strong className="text-amber-300">Line</strong> to inspect & delete · Hold <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-cyan-300">Shift</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-cyan-300">Ctrl</kbd> to drag.
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setConnectModeActive((prev) => !prev);
                  if (connectSourceNode) setConnectSourceNode(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  connectModeActive
                    ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {connectModeActive ? "🔗 Connect Mode: ON" : "🔗 Connect Mode: OFF"}
              </button>

              <button
                onClick={() => setDragModeActive((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dragModeActive
                    ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {dragModeActive ? "🖐 Drag Mode: ON" : "✋ Drag Mode: OFF"}
              </button>

              {connectSourceNode && (
                <button
                  onClick={() => setConnectSourceNode(null)}
                  className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[11px] font-semibold cursor-pointer"
                >
                  Cancel Connection
                </button>
              )}
            </div>
          </div>

          {/* MapLibre Map */}
          <div className="flex-1 relative">
            <MapLibreContainer
              center={AASTU_CENTER_LNG_LAT}
              zoom={DEFAULT_ZOOM}
              minZoom={13}
              maxZoom={22}
              tileMode={tileMode}
              onClick={handleMapClick}
              className="h-full w-full bg-slate-950"
            >
              <CampusBoundaryPolygon />
              <RoadEdgesLayer
                edges={edges}
                nodeMap={nodeMap}
                selectedEdgeId={selectedEdge?.id ?? null}
                onSelectEdge={handleSelectEdge}
              />

              {nodes.map((node) => (
                <RoadNodeMarker
                  key={node.id}
                  node={node}
                  isSelected={selectedNode?.id === node.id}
                  isConnectSource={connectSourceNode?.id === node.id}
                  isDraggable={isModifierPressed || dragModeActive}
                  onNodeClick={handleNodeClick}
                  onDragEnd={handleMarkerDragEnd}
                />
              ))}
            </MapLibreContainer>

            {/* Satellite / Street Switch Button */}
            <div className="absolute top-4 right-4 z-20 flex gap-1 bg-[#0B132B]/90 p-1 rounded-xl border border-slate-700 shadow-xl">
              <button
                onClick={() => setTileMode("street")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                  tileMode === "street" ? "bg-cyan-500 text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                Street
              </button>
              <button
                onClick={() => setTileMode("satellite")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                  tileMode === "satellite" ? "bg-cyan-500 text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                Satellite
              </button>
            </div>

            {/* Floating Selection Inspector Panel for Node */}
            {selectedNode && (
              <div className="absolute bottom-6 left-6 z-20 w-80 bg-slate-900/95 border border-cyan-500/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-slate-100 animate-fade-in">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Waypoints size={16} />
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Road Waypoint Node</h4>
                      <p className="text-sm font-bold text-white">{selectedNode.name ?? "Unnamed Node"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 text-[11px] font-mono bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">LATITUDE</span>
                    <span className="text-cyan-300">{selectedNode.latitude.toFixed(6)}°N</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">LONGITUDE</span>
                    <span className="text-cyan-300">{selectedNode.longitude.toFixed(6)}°E</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-800/60 flex items-center justify-between text-slate-400">
                    <span>Connected Roads:</span>
                    <span className="text-white font-bold">
                      {edges.filter((e) => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id).length} edges
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setConnectSourceNode(selectedNode);
                      addToast({
                        type: "info",
                        message: `Connecting from "${selectedNode.name}". Click target node.`,
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-colors cursor-pointer border border-amber-500/30"
                  >
                    <Link2 size={14} />
                    Connect
                  </button>
                  <button
                    onClick={() =>
                      setDeleteTarget({
                        type: "node",
                        id: selectedNode.id,
                        name: selectedNode.name ?? "Unnamed Node",
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold transition-colors cursor-pointer border border-red-500/30"
                  >
                    <Trash2 size={14} />
                    Delete Node
                  </button>
                </div>
              </div>
            )}

            {/* Floating Selection Inspector Panel for Edge (Line) */}
            {selectedEdge && (
              <div className="absolute bottom-6 left-6 z-20 w-84 bg-slate-900/95 border border-amber-500/50 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-slate-100 animate-fade-in">
                {(() => {
                  const u = selectedEdge.fromNode ?? nodeMap.get(selectedEdge.fromNodeId);
                  const v = selectedEdge.toNode ?? nodeMap.get(selectedEdge.toNodeId);
                  return (
                    <>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                            <ArrowRightLeft size={16} />
                          </span>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Road Connection Line</h4>
                            <p className="text-xs font-bold text-amber-300">
                              {u?.name ?? selectedEdge.fromNodeId} ↔ {v?.name ?? selectedEdge.toNodeId}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedEdge(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="my-3 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Distance:</span>
                          <span className="font-mono font-bold text-cyan-300">
                            {Math.round(selectedEdge.distance)} meters
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Type:</span>
                          <span className="text-emerald-400 font-semibold text-[11px]">
                            {selectedEdge.isBidirectional ? "Bidirectional (2-way)" : "One-way"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "edge",
                            id: selectedEdge.id,
                            name: `Line between "${u?.name ?? "Node 1"}" and "${v?.name ?? "Node 2"}" (${Math.round(selectedEdge.distance)}m)`,
                          })
                        }
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold transition-colors cursor-pointer border border-red-500/30"
                      >
                        <Trash2 size={14} />
                        Delete Connection Line
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nodes Table View */}
      {viewMode === "nodes" && (
        <div className="p-4 flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">
          <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-sm text-gray-900 dark:text-white">All Road Waypoint Nodes</h2>
              <span className="text-xs text-gray-500 dark:text-slate-400">{nodes.length} nodes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Waypoint Name</th>
                    <th className="px-4 py-3">Latitude</th>
                    <th className="px-4 py-3">Longitude</th>
                    <th className="px-4 py-3">Connections</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {nodes.map((node) => {
                    const connCount = edges.filter(
                      (e) => e.fromNodeId === node.id || e.toNodeId === node.id
                    ).length;

                    return (
                      <tr key={node.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <MapPin size={13} className="text-cyan-500" />
                          {node.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">{node.latitude.toFixed(6)}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{node.longitude.toFixed(6)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold text-[11px]">
                            {connCount} connections
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDeleteTarget({ type: "node", id: node.id, name: node.name ?? "Unnamed Node" })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Node"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Edges Table View */}
      {viewMode === "edges" && (
        <div className="p-4 flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">
          <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-sm text-gray-900 dark:text-white">All Road Connections (Edges)</h2>
              <span className="text-xs text-gray-500 dark:text-slate-400">{edges.length} edges</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">From Node</th>
                    <th className="px-4 py-3">To Node</th>
                    <th className="px-4 py-3">Distance (Haversine)</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {edges.map((edge) => {
                    const u = nodeMap.get(edge.fromNodeId);
                    const v = nodeMap.get(edge.toNodeId);

                    return (
                      <tr key={edge.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{u?.name ?? edge.fromNodeId}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{v?.name ?? edge.toNodeId}</td>
                        <td className="px-4 py-3 font-mono text-cyan-400 font-bold">
                          {Math.round(edge.distance)} m
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[11px]">
                            {edge.isBidirectional ? "Bidirectional (2-way)" : "One-way"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: "edge",
                                id: edge.id,
                                name: `${u?.name ?? "Node 1"} ↔ ${v?.name ?? "Node 2"}`,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Connection"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Create Node Modal */}
      {nodeModalOpen && newLatLng && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-cyan-500/40 bg-[#0B132B] p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <MapPin size={18} className="text-cyan-400" />
              Add Road Waypoint Node
            </h3>

            <form onSubmit={handleCreateNode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Waypoint Name</label>
                <input
                  type="text"
                  required
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  placeholder="e.g. Library Avenue Junction"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div>
                  <span className="block text-[10px] text-slate-500">LATITUDE</span>
                  {newLatLng.lat.toFixed(6)}
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">LONGITUDE</span>
                  {newLatLng.lng.toFixed(6)}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setNodeModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="flex-1" loading={isSubmitting}>
                  Create Node
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Road ${deleteTarget?.type === "node" ? "Node" : "Connection"}`}
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action removes associated road network routes.`}
        danger
        loading={isSubmitting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
