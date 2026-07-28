import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  MapPin, Plus, Trash2, Pencil, Link as LinkIcon, Unlink, RefreshCw, Layers, Compass, ArrowRight,
} from "lucide-react";
import {
  Card, TableToolbar, Pagination, EmptyState, Skeleton, ConfirmDialog, ToastContainer, Button, ActionButton, ErrorBanner,
} from "@/components/ui";
import { roadNetworkApi, type RoadNode, type RoadEdge } from "@/api/roadNetwork.api";
import { useToast } from "@/hooks/useToast";
import { AASTU_CENTER, DEFAULT_ZOOM, TILE_LAYERS, type TileMode } from "@/components/map/mapConfig";
import { CampusBoundaryPolygon } from "@/components/map/CampusBoundaryPolygon";
import { calculateDistanceInMeters } from "@/utils/geo";

// Custom Leaflet DivIcon for Road Nodes
function createNodeIcon(isSelected: boolean, isConnectSource: boolean, isDraggable = false): L.DivIcon {
  const color = isConnectSource ? "#f59e0b" : isSelected ? "#06b6d4" : isDraggable ? "#a78bfa" : "#3b82f6";
  const size = isSelected || isConnectSource ? 22 : 16;

  return L.divIcon({
    className: "road-node-div-icon",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 8px ${color}88;
        cursor: ${isDraggable ? 'move' : 'pointer'};
        transition: all 0.2s ease;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Click listener component for Leaflet Map
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

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
  const [connectSourceNode, setConnectSourceNode] = useState<RoadNode | null>(null);
  const [isModifierPressed, setIsModifierPressed] = useState<boolean>(false);
  const [dragModeActive, setDragModeActive] = useState<boolean>(false);

  // Modals state
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [newLatLng, setNewLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [nodeName, setNodeName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ type: "node" | "edge"; id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track Shift or Control key press for dragging nodes
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Shift" || e.key === "Control") {
        setIsModifierPressed(true);
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

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);


  const handleMapClick = (lat: number, lng: number) => {
    if (connectSourceNode) {
      // Cancel connect mode on map background click
      setConnectSourceNode(null);
      return;
    }
    setNewLatLng({ lat, lng });
    setNodeName(`Waypoint ${nodes.length + 1}`);
    setNodeModalOpen(true);
  };

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
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to create node." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNodeClick = async (node: RoadNode) => {
    if (connectSourceNode) {
      if (connectSourceNode.id === node.id) {
        setConnectSourceNode(null);
        return;
      }
      // Connect source node to clicked target node
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

        setEdges((prev) => [...prev, newEdge]);
        addToast({
          type: "success",
          message: `Connected "${connectSourceNode.name}" ↔ "${node.name}" (${Math.round(dist)}m).`,
        });
      } catch (err: unknown) {
        addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to create connection." });
      } finally {
        setConnectSourceNode(null);
      }
    } else {
      setSelectedNode(node);
    }
  };

  const handleMarkerDragEnd = async (node: RoadNode, e: L.DragEndEvent) => {
    const targetMarker = e.target;
    const newLatLng = targetMarker.getLatLng();
    const newLat = newLatLng.lat;
    const newLng = newLatLng.lng;

    // Update node position locally
    setNodes((prevNodes) =>
      prevNodes.map((n) => (n.id === node.id ? { ...n, latitude: newLat, longitude: newLng } : n))
    );

    // Recalculate connected edge distances locally & persist
    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        if (edge.fromNodeId === node.id || edge.toNodeId === node.id) {
          const uNode = edge.fromNodeId === node.id ? { latitude: newLat, longitude: newLng } : nodeMap.get(edge.fromNodeId);
          const vNode = edge.toNodeId === node.id ? { latitude: newLat, longitude: newLng } : nodeMap.get(edge.toNodeId);
          if (uNode && vNode) {
            const newDist = calculateDistanceInMeters(uNode.latitude, uNode.longitude, vNode.latitude, vNode.longitude);
            roadNetworkApi.updateEdge(edge.id, { distance: newDist }).catch(() => {});
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
    } catch (err: unknown) {
      addToast({ type: "error", message: "Failed to update node position on server." });
      loadData();
    }
  };


  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      if (deleteTarget.type === "node") {
        await roadNetworkApi.deleteNode(deleteTarget.id);
        setNodes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
        setEdges((prev) => prev.filter((e) => e.fromNodeId !== deleteTarget.id && e.toNodeId !== deleteTarget.id));
        if (selectedNode?.id === deleteTarget.id) setSelectedNode(null);
        addToast({ type: "success", message: `Deleted node "${deleteTarget.name}".` });
      } else {
        await roadNetworkApi.deleteEdge(deleteTarget.id);
        setEdges((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        addToast({ type: "success", message: `Deleted connection.` });
      }
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Delete failed." });
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  // Node Map Lookup
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0B132B] border-b border-slate-800">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="text-cyan-400" size={18} />
            Road Network Editor
          </h1>
          <p className="text-xs text-slate-400">
            {nodes.length} nodes · {edges.length} road connections inside AASTU campus
          </p>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "map" ? "bg-cyan-500 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Interactive Map
            </button>
            <button
              onClick={() => setViewMode("nodes")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "nodes" ? "bg-cyan-500 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Road Nodes ({nodes.length})
            </button>
            <button
              onClick={() => setViewMode("edges")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "edges" ? "bg-cyan-500 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Connections ({edges.length})
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw size={13} />
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
              <span className={`w-2 h-2 rounded-full ${isModifierPressed || dragModeActive ? "bg-amber-400 animate-ping" : "bg-cyan-400 animate-pulse"}`} />
              <span>
                {connectSourceNode ? (
                  <strong className="text-amber-400 font-bold">
                    Select a target node to connect with "{connectSourceNode.name}"
                  </strong>
                ) : isModifierPressed || dragModeActive ? (
                  <strong className="text-amber-300 font-bold">
                    🎯 DRAG MODE ACTIVE — Click and drag any waypoint node to move its location.
                  </strong>
                ) : (
                  <>Click map to add node · Hold <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-cyan-300">Shift</kbd> or <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-cyan-300">Ctrl</kbd> to drag nodes.</>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
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
                  className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[11px] font-semibold"
                >
                  Cancel Connection
                </button>
              )}
            </div>
          </div>

          {/* Leaflet Map */}
          <div className="flex-1 relative">
            <MapContainer
              center={AASTU_CENTER}
              zoom={DEFAULT_ZOOM}
              minZoom={13}
              maxZoom={22}
              zoomControl={false}
              className="h-full w-full z-0 bg-slate-950"
            >
              <TileLayer
                attribution={TILE_LAYERS[tileMode].attribution}
                url={TILE_LAYERS[tileMode].url}
                maxZoom={22}
                maxNativeZoom={TILE_LAYERS[tileMode].maxNativeZoom}
              />
              <CampusBoundaryPolygon />
              <MapClickHandler onMapClick={handleMapClick} />

              {/* Render Road Edges as Blue Polylines */}
              {edges.map((edge) => {
                const u = nodeMap.get(edge.fromNodeId);
                const v = nodeMap.get(edge.toNodeId);
                if (!u || !v) return null;

                const positions: [number, number][] = [
                  [u.latitude, u.longitude],
                  [v.latitude, v.longitude],
                ];

                return (
                  <Polyline
                    key={edge.id}
                    positions={positions}
                    pathOptions={{
                      color: "#06b6d4",
                      weight: 4,
                      opacity: 0.85,
                      dashArray: edge.isBidirectional ? undefined : "6, 6",
                    }}
                  >
                    <Popup className="road-network-popup">
                      <div className="p-2 space-y-1 text-xs">
                        <p className="font-bold text-slate-900 flex items-center gap-1">
                          <span>{u.name}</span>
                          <ArrowRight size={12} />
                          <span>{v.name}</span>
                        </p>
                        <p className="text-slate-600 font-semibold">
                          Distance: {Math.round(edge.distance)} m ({edge.isBidirectional ? "Two-way" : "One-way"})
                        </p>
                        <button
                          onClick={() => setDeleteTarget({ type: "edge", id: edge.id, name: `${u.name} ↔ ${v.name}` })}
                          className="mt-1 flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold text-[11px]"
                        >
                          <Trash2 size={12} /> Delete Connection
                        </button>
                      </div>
                    </Popup>
                  </Polyline>
                );
              })}

              {/* Render Road Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isSource = connectSourceNode?.id === node.id;
                const isDraggable = isModifierPressed || dragModeActive;

                return (
                  <Marker
                    key={node.id}
                    position={[node.latitude, node.longitude]}
                    draggable={isDraggable}
                    icon={createNodeIcon(isSelected, isSource, isDraggable)}
                    eventHandlers={{
                      click: (e) => {
                        e.originalEvent.stopPropagation();
                        handleNodeClick(node);
                      },
                      dragend: (e) => {
                        handleMarkerDragEnd(node, e);
                      },
                    }}
                  >

                    <Popup className="road-network-popup">
                      <div className="p-2 space-y-2 text-xs">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{node.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">
                            {node.latitude.toFixed(5)}°N, {node.longitude.toFixed(5)}°E
                          </p>
                        </div>

                        <div className="flex flex-col gap-1 pt-1 border-t border-slate-200">
                          <button
                            onClick={() => setConnectSourceNode(node)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold"
                          >
                            <LinkIcon size={12} /> Connect to another node
                          </button>

                          <button
                            onClick={() => setDeleteTarget({ type: "node", id: node.id, name: node.name })}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-semibold"
                          >
                            <Trash2 size={12} /> Delete node
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Satellite / Street Switch Button */}
            <div className="absolute top-4 right-4 z-20 flex gap-1 bg-[#0B132B]/90 p-1 rounded-xl border border-slate-700 shadow-xl">
              <button
                onClick={() => setTileMode("street")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg ${tileMode === "street" ? "bg-cyan-500 text-white" : "text-slate-300"}`}
              >
                Street
              </button>
              <button
                onClick={() => setTileMode("satellite")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg ${tileMode === "satellite" ? "bg-cyan-500 text-white" : "text-slate-300"}`}
              >
                Satellite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nodes Table View */}
      {viewMode === "nodes" && (
        <div className="p-4 flex-1 overflow-y-auto bg-slate-900">
          <Card className="bg-[#0B132B] border-slate-800 text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-sm text-white">All Road Waypoint Nodes</h2>
              <span className="text-xs text-slate-400">{nodes.length} nodes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/50 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Waypoint Name</th>
                    <th className="px-4 py-3">Latitude</th>
                    <th className="px-4 py-3">Longitude</th>
                    <th className="px-4 py-3">Connections</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {nodes.map((node) => {
                    const connCount = edges.filter(
                      (e) => e.fromNodeId === node.id || e.toNodeId === node.id
                    ).length;

                    return (
                      <tr key={node.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-semibold text-white">{node.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{node.latitude.toFixed(6)}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{node.longitude.toFixed(6)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold text-[11px]">
                            {connCount} connections
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDeleteTarget({ type: "node", id: node.id, name: node.name })}
                            className="p-1 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 size={14} />
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
        <div className="p-4 flex-1 overflow-y-auto bg-slate-900">
          <Card className="bg-[#0B132B] border-slate-800 text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-sm text-white">All Road Connections (Edges)</h2>
              <span className="text-xs text-slate-400">{edges.length} edges</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/50 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">From Node</th>
                    <th className="px-4 py-3">To Node</th>
                    <th className="px-4 py-3">Distance (Haversine)</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {edges.map((edge) => {
                    const u = nodeMap.get(edge.fromNodeId);
                    const v = nodeMap.get(edge.toNodeId);

                    return (
                      <tr key={edge.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-semibold text-white">{u?.name ?? edge.fromNodeId}</td>
                        <td className="px-4 py-3 font-semibold text-white">{v?.name ?? edge.toNodeId}</td>
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
                                name: `${u?.name} ↔ ${v?.name}`,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 size={14} />
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
        description={`Delete "${deleteTarget?.name}"? This action removes associated road routes.`}
        danger
        loading={isSubmitting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
