import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import styles from "./InteractiveMap.module.css";
import { Player, TransportType } from "@packages/types";
import { PlayerIcon } from "./PlayerIcon";
import { PositionNode } from "./PositionNode";
import { getValidMoves, TRANSPORT_COLOURS, DEFAULT_MAP_ID, MapId } from "@packages/utils";
import { LECTURER_MUST_REVEAL_TURNS } from "@packages/utils";
import { apiClient } from "@packages/api";

interface InteractiveMapProps {
    players: Player[];
    currentRound: number;
    isLecturer: boolean;
    gameOver?: boolean;
    gamePin: string;
    currentPlayerId?: string;
    currentTurn?: string;
    selectedTransport?: TransportType | null;
    onMove?: (destination: number, transport: TransportType) => void;
    mapId?: MapId;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ players, currentRound, isLecturer = false, gameOver = false, gamePin, currentPlayerId, currentTurn, selectedTransport = null, onMove, mapId = DEFAULT_MAP_ID }) => {
    const displayPlayers = players.filter(p => !p.isSpectator && p.position !== 0);

    // ── ALL HOOKS FIRST ──────────────────────────────
    const [mapData, setMapData] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
    const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });
    const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
    const wasDraggingRef = useRef(false);
    const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        let cancelled = false;
        apiClient.getMap(mapId).then((data: any) => {
            if (!cancelled) setMapData(data);
        }).catch((err: any) => {
            console.log("Failed to load map:", err);
        });
        return () => { cancelled = true; };
    }, [mapId]);

    useEffect(() => {
        setContainerDims({
            width: window.innerWidth,
            height: window.innerHeight,
        });

        const handleResize = () => {
            setContainerDims({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getMinScale = useCallback(() => {
        if (!imgDims.width || !containerDims.width) return 1;
        const scaleX = containerDims.width / imgDims.width;
        const scaleY = containerDims.height / imgDims.height;
        return Math.min(scaleX, scaleY) * 0.5;
    }, [imgDims, containerDims]);

    const constrainPos = useCallback(
        (x: number, y: number, s: number) => {
            if (!imgDims.width) return { x, y };
            const scaledW = imgDims.width * s;
            const scaledH = imgDims.height * s;
            let newX = x;
            let newY = y;
            if (scaledW < containerDims.width) {
                newX = (containerDims.width - scaledW) / 2;
            } else {
                newX = Math.min(0, Math.max(containerDims.width - scaledW, x));
            }
            if (scaledH < containerDims.height) {
                newY = (containerDims.height - scaledH) / 2;
            } else {
                newY = Math.min(0, Math.max(containerDims.height - scaledH, y));
            }
            return { x: newX, y: newY };
        },
        [imgDims, containerDims]
    );

    useEffect(() => {
        const minScale = getMinScale();
        if (scale < minScale) setScale(minScale);
        const constrained = constrainPos(pos.x, pos.y, Math.max(scale, minScale));
        if (constrained.x !== pos.x || constrained.y !== pos.y) setPos(constrained);
    }, [getMinScale, scale, pos.x, pos.y, constrainPos]);

    useEffect(() => {
        if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0 && containerDims.width > 0) {
            handleImageLoad({
                currentTarget: imgRef.current,
            } as React.SyntheticEvent<HTMLImageElement>);
        } 
    }, [containerDims]);

    const currentPlayerObj = useMemo(() => {
        if (!currentPlayerId) return null;
        return players.find((p) => p.id === currentPlayerId) ?? null;
    }, [players, currentPlayerId]);

    const isMyTurn = !gameOver && !!currentPlayerId && currentPlayerId === currentTurn;

    const MAP_NODES = useMemo(() => {
        if (!mapData) return [];
        return mapData.locations.map((loc: any) => ({
            id: loc.location,
            x: (loc.xPos / mapData.mapWidth) * 100,
            y: (loc.yPos / mapData.mapHeight) * 100,
            transports: mapData.connections
                .filter((c: any) => c.locationA === loc.location || c.locationB === loc.location)
                .map((c: any) => c.ticket.toLowerCase()),
        }));
    }, [mapData]);

    const MAP_EDGES = useMemo(() => {
        if (!mapData) return [];
        return mapData.connections.map((c: any) => ({
            from: c.locationA,
            to: c.locationB,
            type: c.ticket.toLowerCase(),
        }));
    }, [mapData]);

    const nodeDegrees = useMemo(() => {
        const deg: Record<number, number> = {};
        MAP_EDGES.forEach((edge) => {
            deg[edge.from] = (deg[edge.from] || 0) + 1;
            deg[edge.to] = (deg[edge.to] || 0) + 1;
        });
        return deg;
    }, [MAP_EDGES]);

    const validMoves = useMemo(() => {
        if (!isMyTurn || !currentPlayerObj || !mapData) return new Map<number, TransportType[]>();
        return getValidMoves({ nodes: MAP_NODES, edges: MAP_EDGES }, currentPlayerObj.position, currentPlayerObj.tickets, players);
    }, [isMyTurn, currentPlayerObj, MAP_NODES, MAP_EDGES]);

    const filteredValidMoves = useMemo(() => {
        if (!selectedTransport || !isMyTurn) return new Map<number, TransportType[]>();
        const filtered = new Map<number, TransportType[]>();
        validMoves.forEach((transports, nodeId) => {
            if (transports.includes(selectedTransport)) filtered.set(nodeId, [selectedTransport]);
        });
        return filtered;
    }, [validMoves, selectedTransport, isMyTurn]);

    const playersByPosition = useMemo(() => {
        const groups: Record<number, Player[]> = {};
        displayPlayers.forEach((p) => {
            const canSeeLecturer = isLecturer || LECTURER_MUST_REVEAL_TURNS.includes(currentRound) || gameOver;
            if (p.isLecturer && !canSeeLecturer) return;
            if (!groups[p.position]) groups[p.position] = [];
            groups[p.position].push(p);
        });
        return groups;
    }, [displayPlayers, isLecturer, currentRound, gameOver]);

    const handleNodeClick = useCallback(
        (nodeId: number, e: React.MouseEvent) => {
            e.stopPropagation();
            if (wasDraggingRef.current) return;
            if (!isMyTurn || !onMove) return;
            if (!selectedTransport) {
                if (validMoves.has(nodeId)) alert("Select a transport first!\nChoose one from the bar at the bottom.");
                return;
            }
            if (!filteredValidMoves.has(nodeId)) return;
            onMove(nodeId, selectedTransport);
        },
        [isMyTurn, onMove, selectedTransport, validMoves, filteredValidMoves]
    );

    const getNodeHighlight = useCallback(
        (nodeId: number) => {
            if (currentPlayerObj && nodeId === currentPlayerObj.position) return "inspected" as const;
            if (isMyTurn && filteredValidMoves.has(nodeId)) return "pending" as const;
            if (!isMyTurn && hoveredNodeId === nodeId) return "hovered" as const;
            return "none" as const;
        },
        [filteredValidMoves, isMyTurn, currentPlayerObj, hoveredNodeId]
    );
    // ── END HOOKS ─────────────────────────────────────

    // Early return AFTER all hooks
    if (!mapData) return <div className={styles.mapContainer} />;

    console.log("imgDims:", imgDims, "containerDims:", containerDims, "scale:", scale);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        wasDraggingRef.current = false;
        dragStartPosRef.current = { x: e.clientX, y: e.clientY };
        setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        if (dragStartPosRef.current) {
            const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
            const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
            if (dx > 4 || dy > 4) wasDraggingRef.current = true;
        }
        setPos(constrainPos(e.clientX - dragStart.x, e.clientY - dragStart.y, scale));
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        const newScale = Math.max(getMinScale(), Math.min(scale * (1 - e.deltaY * 0.001), 5));
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const nextX = mouseX - ((mouseX - pos.x) / scale) * newScale;
            const nextY = mouseY - ((mouseY - pos.y) / scale) * newScale;
            setPos(constrainPos(nextX, nextY, newScale));
            setScale(newScale);
        }
    };

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const dims = { width: img.naturalWidth, height: img.naturalHeight };
    setImgDims(dims);
    if (containerDims.width > 0 && containerDims.height > 0) {
        const scaleX = containerDims.width / dims.width;
        const scaleY = containerDims.height / dims.height;
        // Use the LARGER scale to fill the screen completely
        const initialScale = Math.max(scaleX, scaleY);
        setScale(initialScale);
        const initialX = (containerDims.width - dims.width * initialScale) / 2;
        const initialY = (containerDims.height - dims.height * initialScale) / 2;
        setPos({ x: initialX, y: initialY });
    }
};

    return (
        <div ref={containerRef} className={styles.mapContainer} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
            <div
                className={styles.mapWrapper}
                style={{
                    transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                    transformOrigin: "0 0",
                    width: imgDims.width,
                    height: imgDims.height,
                }}
            >
                <img ref={imgRef} src="/leeds_center_map.png"  alt="Game Map" className={styles.mapImage} onLoad={handleImageLoad} draggable={false} />
                {imgDims.width > 0 && (
                    <>
                        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                            <defs>
                                <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
                                    <feOffset dx="0" dy="1" result="offsetblur" />
                                    <feComponentTransfer><feFuncA type="linear" slope="0.5" /></feComponentTransfer>
                                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>
                            {MAP_EDGES.map((edge) => {
                                const fromNode = MAP_NODES.find((n) => n.id === edge.from);
                                const toNode = MAP_NODES.find((n) => n.id === edge.to);
                                if (!fromNode || !toNode) return null;
                                const isMulti = (nodeDegrees[edge.from] || 0) > 2 || (nodeDegrees[edge.to] || 0) > 2;
                                const highlight = (isMyTurn && !!selectedTransport && edge.type === selectedTransport && edge.from === currentPlayerObj?.position && filteredValidMoves.has(edge.to)) || (!isMyTurn && hoveredNodeId !== null && (edge.from === hoveredNodeId || edge.to === hoveredNodeId));
                                return <line key={`${edge.from}-${edge.to}-${edge.type}`} x1={`${fromNode.x}%`} y1={`${fromNode.y}%`} x2={`${toNode.x}%`} y2={`${toNode.y}%`} filter="url(#lineShadow)" strokeLinecap="round" stroke={TRANSPORT_COLOURS[edge.type]} strokeWidth={highlight ? 4 : 2} opacity={highlight ? 1 : 0.6} strokeDasharray={isMulti ? "4 4" : undefined} />;
                            })}
                        </svg>
                        {MAP_NODES.map((node) => (
                            <PositionNode key={node.id} label={node.id} transports={node.transports} x={node.x} y={node.y} highlight={getNodeHighlight(node.id)} onClick={(e) => handleNodeClick(node.id, e)} onMouseEnter={() => !isMyTurn && setHoveredNodeId(node.id)} onMouseLeave={() => setHoveredNodeId(null)} />
                        ))}
                        {Object.entries(playersByPosition).map(([posId, group]) => {
                            const node = MAP_NODES.find((n) => n.id === parseInt(posId));
                            if (!node) return null;
                            return <PlayerIcon key={posId} players={group} x={(node.x / 100) * imgDims.width} y={(node.y / 100) * imgDims.height} dim={(isMyTurn && !!selectedTransport) || (!isMyTurn && hoveredNodeId !== null)} />;
                        })}
                    </>
                )}
            </div>
        </div>
    );
};