import React, { useState, useRef, useEffect, useCallback, MouseEvent } from "react";
import { TransportType } from "@packages/types";
import { TransportIcon } from "../components/play/TransportIcons";
import { PositionNode, NodeHighlight } from "../components/play/PositionNode";
import styles from "../components/NodeTool.module.css";
import { TRANSPORT_COLOURS, AVAILABLE_MAPS, MapDefinition } from "@packages/utils";
import { MAP_IMAGES } from "@packages/assets";

interface NodeData {
    id: number;
    x: number;
    y: number;
}

interface ConnectionData {
    id: string;
    from: number;
    to: number;
    type: TransportType;
}

type Mode = "add" | "connect" | "move";

const LINKABLE_TRANSPORTS: TransportType[] = ["taxi", "bus", "bike"];

interface PendingLink {
    fromId: number;
    transport: TransportType;
}

export default function NodeTool() {
    const [selectedMap, setSelectedMap] = useState<MapDefinition>(AVAILABLE_MAPS[0]);
    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [connections, setConnections] = useState<ConnectionData[]>([]);

    const [mode, setMode] = useState<Mode>("add");
    const [selectedTransport, setSelectedTransport] = useState<TransportType>("taxi");
    const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
    const [inspectedNodeId, setInspectedNodeId] = useState<number | null>(null);
    const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);
    const [validationMsg, setValidationMsg] = useState<string>("");

    const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

    const mapRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contentSt, setContentSt] = useState({ left: 0, top: 0, width: 0, height: 0 });

    const computeContent = useCallback(() => {
        const img = imgRef.current;
        const map = mapRef.current;
        if (!img?.naturalWidth || !map) return;
        const s = Math.min(map.clientWidth / img.naturalWidth, map.clientHeight / img.naturalHeight);
        const w = img.naturalWidth * s;
        const h = img.naturalHeight * s;
        setContentSt({ left: (map.clientWidth - w) / 2, top: (map.clientHeight - h) / 2, width: w, height: h });
    }, []);

    useEffect(() => {
        computeContent();
        window.addEventListener("resize", computeContent);
        return () => window.removeEventListener("resize", computeContent);
    }, [computeContent]);

    const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
        if (!mapRef.current || !contentSt.width) return;

        const mapRect = mapRef.current.getBoundingClientRect();
        const localX = e.clientX - mapRect.left - contentSt.left;
        const localY = e.clientY - mapRect.top - contentSt.top;
        if (localX < 0 || localY < 0 || localX > contentSt.width || localY > contentSt.height) return;
        const xPercent = (localX / contentSt.width) * 100;
        const yPercent = (localY / contentSt.height) * 100;

        if (mode === "add") {
            const newId = nodes.length > 0 ? Math.max(...nodes.map((n) => n.id)) + 1 : 1;
            setNodes([...nodes, { id: newId, x: xPercent, y: yPercent }]);
            setValidationMsg("");
        } else if (mode === "move" && selectedNodeId !== null) {
            setNodes(nodes.map((n) => (n.id === selectedNodeId ? { ...n, x: xPercent, y: yPercent } : n)));
            setSelectedNodeId(null);
        }
    };

    const createConnection = (fromId: number, toId: number, transport: TransportType) => {
        if (fromId === toId) return;
        const newConn: ConnectionData = {
            id: `${fromId}-${toId}-${transport}`,
            from: fromId,
            to: toId,
            type: transport,
        };
        if (!connections.some((c) => c.from === newConn.from && c.to === newConn.to && c.type === newConn.type)) {
            setConnections((prev) => [...prev, newConn]);
        }
    };

    const handleNodeClick = (e: MouseEvent, id: number) => {
        e.stopPropagation();

        // If a "Link" is pending from the node panel, complete the connection
        if (pendingLink !== null) {
            createConnection(pendingLink.fromId, id, pendingLink.transport);
            setPendingLink(null);
            setInspectedNodeId(id);
            return;
        }

        // Always update the inspected node for the info panel
        setInspectedNodeId(id);

        if (mode === "connect") {
            if (selectedNodeId === null) {
                setSelectedNodeId(id);
            } else {
                createConnection(selectedNodeId, id, selectedTransport);
                setSelectedNodeId(null);
            }
        } else if (mode === "move") {
            setSelectedNodeId(id);
        }
    };

    const handleStartLink = (transport: TransportType) => {
        if (inspectedNodeId === null) return;
        setPendingLink({ fromId: inspectedNodeId, transport });
    };

    const handleToggleTransport = (transport: TransportType, hasType: boolean) => {
        if (inspectedNodeId === null) return;
        if (hasType) {
            // Remove all connections of this type to/from this node
            setConnections((prev) => prev.filter((c) => !((c.from === inspectedNodeId || c.to === inspectedNodeId) && c.type === transport)));
        } else {
            // Start a link for this transport
            handleStartLink(transport);
        }
    };

    const exportData = () => {
        // Validation: Check for orphaned nodes
        const connectedNodeIds = new Set(connections.flatMap((c) => [c.from, c.to]));
        const orphans = nodes.filter((n) => !connectedNodeIds.has(n.id));

        if (orphans.length > 0) {
            setValidationMsg(`Warning: Found orphaned nodes: ${orphans.map((o) => o.id).join(", ")}`);
            return;
        }

        const exportJson = {
            nodes: nodes.map((n) => {
                const nodeConnections = connections.filter((c) => c.from === n.id || c.to === n.id);
                const transports = Array.from(new Set(nodeConnections.map((c) => c.type)));
                return { ...n, transports };
            }),
            edges: connections.map(({ id, ...rest }) => rest),
        };

        const blob = new Blob([JSON.stringify(exportJson, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = selectedMap.exportFileName;
        a.click();
        URL.revokeObjectURL(url);
        setValidationMsg("Exported successfully!");
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
                    setValidationMsg("Warning: Invalid JSON format — expected { nodes, edges }");
                    return;
                }
                const importedNodes: NodeData[] = data.nodes.map((n: any) => ({
                    id: n.id,
                    x: n.x,
                    y: n.y,
                }));
                const importedConns: ConnectionData[] = data.edges.map((e: any) => ({
                    id: `${e.from}-${e.to}-${e.type}`,
                    from: e.from,
                    to: e.to,
                    type: e.type as TransportType,
                }));
                setNodes(importedNodes);
                setConnections(importedConns);
                setInspectedNodeId(null);
                setPendingLink(null);
                setSelectedNodeId(null);
                setValidationMsg(`Imported ${importedNodes.length} nodes, ${importedConns.length} edges.`);
            } catch {
                setValidationMsg("Warning: Failed to parse JSON file.");
            }
        };
        reader.readAsText(file);
        // Reset so the same file can be re-imported
        e.target.value = "";
    };

    const getNodeTransports = (nodeId: number): TransportType[] => Array.from(new Set(connections.filter((c) => c.from === nodeId || c.to === nodeId).map((c) => c.type)));

    const inspectedNode = inspectedNodeId !== null ? nodes.find((n) => n.id === inspectedNodeId) : null;
    const inspectedNodeConnTypes = inspectedNodeId !== null ? new Set(connections.filter((c) => c.from === inspectedNodeId || c.to === inspectedNodeId).map((c) => c.type)) : null;

    return (
        <div className={styles.page}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div>
                    <strong>Map: </strong>
                    <select
                        value={selectedMap.id}
                        onChange={(e) => {
                            const map = AVAILABLE_MAPS.find((m) => m.id === e.target.value);
                            if (map) {
                                setSelectedMap(map);
                                setNodes([]);
                                setConnections([]);
                                setSelectedNodeId(null);
                                setInspectedNodeId(null);
                                setPendingLink(null);
                                setValidationMsg("");
                            }
                        }}
                    >
                        {AVAILABLE_MAPS.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <strong>Mode: </strong>
                    <select
                        value={mode}
                        onChange={(e) => {
                            setMode(e.target.value as Mode);
                            setSelectedNodeId(null);
                            setPendingLink(null);
                        }}
                    >
                        <option value="add">Add Node</option>
                        <option value="connect">Connect Nodes</option>
                        <option value="move">Move Node</option>
                    </select>
                </div>

                {mode === "connect" && (
                    <div>
                        <strong>Transport: </strong>
                        <select value={selectedTransport} onChange={(e) => setSelectedTransport(e.target.value as TransportType)}>
                            <option value="taxi">Taxi (Yellow)</option>
                            <option value="bus">Bus (Green)</option>
                            <option value="bike">Bike (Blue)</option>
                        </select>
                    </div>
                )}

                <button onClick={exportData} className={styles.toolBtn}>
                    Validate & Export JSON
                </button>

                <button onClick={() => fileInputRef.current?.click()} className={styles.toolBtn}>
                    Import JSON
                </button>
                <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={handleImport} />

                <span
                    className={styles.validationMsg}
                    style={{
                        color: validationMsg.startsWith("Warning") ? "red" : "green",
                    }}
                >
                    {validationMsg}
                </span>

                {/* Node Info Panel */}
                {inspectedNode && inspectedNodeConnTypes && (
                    <div className={styles.nodePanel}>
                        <strong className={styles.nodePanelTitle}>Node {inspectedNode.id}</strong>
                        {LINKABLE_TRANSPORTS.map((transport) => {
                            const hasType = inspectedNodeConnTypes.has(transport);
                            const isLinking = pendingLink?.fromId === inspectedNodeId && pendingLink?.transport === transport;
                            return (
                                <div key={transport} className={styles.transportRow}>
                                    <input type="checkbox" checked={hasType} title={hasType ? `Remove all ${transport} connections` : `Start linking ${transport}`} onChange={() => handleToggleTransport(transport, hasType)} className={styles.transportCheckbox} style={{ accentColor: TRANSPORT_COLOURS[transport] }} />
                                    <TransportIcon type={transport} />
                                    <button
                                        onClick={() => handleStartLink(transport)}
                                        className={styles.linkBtn}
                                        style={{
                                            background: isLinking ? TRANSPORT_COLOURS[transport] : "#e0e0e0",
                                            border: isLinking ? "2px solid #333" : "1px solid #aaa",
                                            fontWeight: isLinking ? "bold" : "normal",
                                        }}
                                    >
                                        {isLinking ? "Click target…" : "Link"}
                                    </button>
                                </div>
                            );
                        })}
                        {pendingLink && pendingLink.fromId === inspectedNodeId && (
                            <button onClick={() => setPendingLink(null)} className={styles.cancelBtn}>
                                ✕ Cancel
                            </button>
                        )}
                    </div>
                )}

                {!inspectedNode && (
                    <div className={styles.hint}>
                        {mode === "move" ? "Click node, then click map to move" : ""}
                        {mode === "connect" ? "Click first node, then second node to link" : ""}
                        {mode === "add" ? "Click map to add a node" : ""}
                    </div>
                )}
            </div>

            {/* Map Area */}
            <div ref={mapRef} onClick={handleMapClick} className={styles.mapArea} style={{ cursor: mode === "add" ? "crosshair" : "default" }}>
                {/* Background Image */}
                <img ref={imgRef} src={MAP_IMAGES[selectedMap.id].src} alt={`${selectedMap.name} Map`} className={styles.mapImage} onLoad={computeContent} />

                {contentSt.width > 0 && (
                    <div style={{ position: "absolute", left: contentSt.left, top: contentSt.top, width: contentSt.width, height: contentSt.height }}>
                        {/* Connection Lines (SVG Overlay) */}
                        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                            {connections.map((conn, idx) => {
                                const fromNode = nodes.find((n) => n.id === conn.from);
                                const toNode = nodes.find((n) => n.id === conn.to);
                                if (!fromNode || !toNode) return null;

                                const siblings = connections.filter((c) => (c.from === conn.from && c.to === conn.to) || (c.from === conn.to && c.to === conn.from));
                                const siblingIndex = siblings.indexOf(conn);
                                const strokeDasharray = siblingIndex === 1 ? "5,5" : siblingIndex === 2 ? "2,2" : "none";
                                const isConnected = hoveredNodeId !== null && (conn.from === hoveredNodeId || conn.to === hoveredNodeId);

                                return <line key={conn.id} x1={`${fromNode.x}%`} y1={`${fromNode.y}%`} x2={`${toNode.x}%`} y2={`${toNode.y}%`} stroke={TRANSPORT_COLOURS[conn.type]} strokeWidth={isConnected ? 5 : 3} strokeDasharray={strokeDasharray} opacity={isConnected ? 1 : 0.6} />;
                            })}
                        </svg>

                        {/* Nodes */}
                        {nodes.map((node) => {
                            let highlight: NodeHighlight = "none";
                            if (selectedNodeId === node.id) highlight = "selected";
                            else if (pendingLink?.fromId === node.id) highlight = "pending";
                            else if (inspectedNodeId === node.id) highlight = "inspected";
                            if (hoveredNodeId === node.id) highlight = "hovered";
                            return <PositionNode key={node.id} x={node.x} y={node.y} label={node.id} transports={getNodeTransports(node.id)} highlight={highlight} onClick={(e) => handleNodeClick(e, node.id)} onMouseEnter={() => setHoveredNodeId(node.id)} onMouseLeave={() => setHoveredNodeId(null)} />;
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
