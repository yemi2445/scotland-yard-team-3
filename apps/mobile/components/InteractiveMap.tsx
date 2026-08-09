import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { View, Image, Text, StyleSheet, Animated, PanResponder, Dimensions, Platform } from "react-native";
import { Player, TransportType } from "@packages/types";
import { getValidMoves, TRANSPORT_COLOURS } from "@packages/utils";
import { LECTURER_MUST_REVEAL_TURNS } from "@packages/utils";
import { PositionNode } from "./PositionNode";
import { PlayerIcon } from "./PlayerIcon";
import { apiClient } from "@packages/api";

interface InteractiveMapProps {
    players: Player[];
    currentRound: number;
    isLecturer: boolean;
    gameOver?: boolean;
    gamePin: string;
    currentPlayerId?: string;
    currentTurn?: string | null;
    selectedTransport?: TransportType | null;
    onMove?: (destination: number, transport: TransportType) => void;
    mapId?: any;
}

export default function InteractiveMap({ players = [], currentRound = 1, isLecturer = false, gameOver = false, gamePin, currentPlayerId, currentTurn, selectedTransport = null, onMove, mapId }: InteractiveMapProps) {
    const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
    const displayPlayers = players.filter(p => !p.isSpectator && p.position !== 0);

    // The map layout (image, node coordinates, connections) lives on the game server, keyed by
    // the numeric mapId a game was created with — it must be fetched per-game, not bundled
    // locally, since different games can use different maps.
    const [mapData, setMapData] = useState<any>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    useEffect(() => {
        let cancelled = false;
        if (mapId === undefined || mapId === null) {
            setMapError(`No mapId provided (received ${JSON.stringify(mapId)})`);
            return;
        }
        setMapError(null);
        apiClient.getMap(mapId).then((data: any) => {
            if (!cancelled) setMapData(data);
        }).catch((err: any) => {
            if (!cancelled) setMapError(err instanceof Error ? err.message : String(err));
        });
        return () => { cancelled = true; };
    }, [mapId]);

    const MAP_ORIGINAL_WIDTH = mapData?.mapWidth ?? 1;
    const MAP_ORIGINAL_HEIGHT = mapData?.mapHeight ?? 1;

    // Node size in un-scaled map-space units. Target ~50pt on screen at the initial fit-to-screen
    // zoom (comfortably above Apple's 44pt minimum tappable target), regardless of how large the
    // underlying map image is — a fixed pixel size like 24 or 40 renders as a few pixels wide on
    // a 6600px-wide map scaled down to fit a phone screen.
    const fitScale = mapData ? screenWidth / MAP_ORIGINAL_WIDTH : 1;
    const nodeSize = Math.min(220, 50 / fitScale);

    const MAP_NODES = useMemo(() => {
        if (!mapData) return [] as { id: number; x: number; y: number; transports: TransportType[] }[];
        // Some map datasets contain duplicate location ids — keep only the first occurrence so
        // every node stays individually addressable and clickable.
        const seen = new Set<number>();
        const nodes: { id: number; x: number; y: number; transports: TransportType[] }[] = [];
        for (const loc of mapData.locations) {
            if (seen.has(loc.location)) continue;
            seen.add(loc.location);
            nodes.push({
                id: loc.location,
                x: (loc.xPos / mapData.mapWidth) * 100,
                y: (loc.yPos / mapData.mapHeight) * 100,
                transports: mapData.connections
                    .filter((c: any) => c.locationA === loc.location || c.locationB === loc.location)
                    .map((c: any) => c.ticket.toLowerCase()),
            });
        }
        return nodes;
    }, [mapData]);

    const MAP_EDGES = useMemo<{ from: number; to: number; type: TransportType }[]>(() => {
        if (!mapData) return [];
        return mapData.connections.map((c: any) => ({
            from: c.locationA,
            to: c.locationB,
            type: c.ticket.toLowerCase() as TransportType,
        }));
    }, [mapData]);

    const scale = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    const last = useRef({ scale: 1, x: 0, y: 0, distance: 0 });
    // The "fit to screen" scale varies hugely by map (e.g. ~0.13 for a 6600px-wide map on a
    // ~850pt screen). Pinch/wheel zoom bounds must scale relative to this, not a fixed absolute
    // range — a hardcoded floor like 0.4 sits way above the actual starting scale, so the very
    // first pinch snapped straight to that floor instead of zooming progressively from where the
    // map actually starts.
    const fitScaleRef = useRef(1);

    const currentPlayerObj = useMemo(() => {
        if (!currentPlayerId) return null;
        return players.find((p) => p.id === currentPlayerId) ?? null;
    }, [players, currentPlayerId]);

    const isMyTurn = !gameOver && !!currentPlayerId && currentPlayerId === currentTurn;

    const validMoves = useMemo(() => {
        if (!isMyTurn || !currentPlayerObj || !mapData) return new Map<number, TransportType[]>();
        return getValidMoves({ nodes: MAP_NODES, edges: MAP_EDGES }, currentPlayerObj.position, currentPlayerObj.tickets, players);
    }, [isMyTurn, currentPlayerObj, players, MAP_NODES, MAP_EDGES, mapData]);

    const filteredValidMoves = useMemo(() => {
        if (!selectedTransport || !isMyTurn) return new Map<number, TransportType[]>();
        const filtered = new Map<number, TransportType[]>();
        validMoves.forEach((transports, nodeId) => {
            if (transports.includes(selectedTransport)) filtered.set(nodeId, [selectedTransport]);
        });
        return filtered;
    }, [validMoves, selectedTransport, isMyTurn]);

    const getDistance = (touches: any[]) => {
        const [a, b] = touches;
        return Math.sqrt(Math.pow(a.pageX - b.pageX, 2) + Math.pow(a.pageY - b.pageY, 2));
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (evt, gesture) => {
                const touches = evt.nativeEvent.touches;
                const isZooming = touches && touches.length > 1;
                const isPanning = Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
                return isZooming || isPanning;
            },
            onPanResponderGrant: (evt) => {
                last.current.distance = evt.nativeEvent.touches.length === 2
                    ? getDistance(evt.nativeEvent.touches)
                    : 0;
            },
            onPanResponderMove: (evt, gesture) => {
                if (evt.nativeEvent.touches.length === 2) {
                    const distance = getDistance(evt.nativeEvent.touches);
                    if (last.current.distance === 0) {
                        last.current.distance = distance;
                        last.current.scale = (scale as any)._value;
                    }
                    const scaleFactor = distance / last.current.distance;
                    const minScale = fitScaleRef.current * 0.5;
                    const maxScale = fitScaleRef.current * 8;
                    const newScale = Math.max(minScale, Math.min(maxScale, last.current.scale * scaleFactor));
                    scale.setValue(newScale);
                    return;
                } else {
                    last.current.distance = 0;
                }
                translateX.setValue(last.current.x + gesture.dx);
                translateY.setValue(last.current.y + gesture.dy);
            },
            onPanResponderRelease: () => {
                last.current = {
                    scale: (scale as any)._value,
                    x: (translateX as any)._value,
                    y: (translateY as any)._value,
                    distance: 0,
                };
            },
            onPanResponderTerminate: () => {
                last.current = {
                    scale: (scale as any)._value,
                    x: (translateX as any)._value,
                    y: (translateY as any)._value,
                    distance: 0,
                };
            },
        })
    ).current;

    const handleWheel = (e: any) => {
        if (Platform.OS !== "web") return;
        const delta = -e.deltaY;
        const minScale = fitScaleRef.current * 0.5;
        const maxScale = fitScaleRef.current * 8;
        const newScale = Math.max(minScale, Math.min(maxScale, last.current.scale + (delta / 900) * fitScaleRef.current));
        scale.setValue(newScale);
        last.current.scale = newScale;
    };

    useEffect(() => {
        // screenWidth/screenHeight come from Dimensions.get("window"), known synchronously —
        // no need to gate this on a layout callback (onLayout has proven unreliable here,
        // leaving scale/translate at their Animated.Value defaults of 1/0/0, which renders a
        // huge map at native 1:1 scale with no pan: only a sliver near its top-left corner
        // ever falls inside the visible clipped container, i.e. an apparently blank map).
        if (!mapData) return;

        const initialScale = screenWidth / MAP_ORIGINAL_WIDTH;
        scale.setValue(initialScale);
        last.current.scale = initialScale;
        fitScaleRef.current = initialScale;

        const initialX = -45;
        const initialY = (screenHeight - MAP_ORIGINAL_HEIGHT * initialScale) / 2;

        translateX.setValue(initialX);
        translateY.setValue(initialY);

        last.current.x = initialX;
        last.current.y = initialY;
    }, [mapData, screenWidth, screenHeight]);

    const handleNodePress = useCallback((nodeId: number) => {
            if (!isMyTurn || !onMove) return;

            if (!selectedTransport) {
                if (validMoves.has(nodeId)) {
                    alert("Select a transport first!\nChoose one from the bar at the bottom.");
                }
                return;
            }

            if (!filteredValidMoves.has(nodeId)) return;

            onMove(nodeId, selectedTransport);
        },
        [isMyTurn, onMove, selectedTransport, validMoves, filteredValidMoves]
    );

    const nodeDegrees = useMemo(() => {
        const deg: Record<number, number> = {};
        MAP_EDGES.forEach((edge) => {
            deg[edge.from] = (deg[edge.from] || 0) + 1;
            deg[edge.to] = (deg[edge.to] || 0) + 1;
        });
        return deg;
    }, [MAP_EDGES]);

    const edgeViews = useMemo(() => {
        return MAP_EDGES.map((edge) => {
            const fromNode = MAP_NODES.find((n) => n.id === edge.from);
            const toNode = MAP_NODES.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const x1 = (fromNode.x / 100) * MAP_ORIGINAL_WIDTH;
            const y1 = (fromNode.y / 100) * MAP_ORIGINAL_HEIGHT;
            const x2 = (toNode.x / 100) * MAP_ORIGINAL_WIDTH;
            const y2 = (toNode.y / 100) * MAP_ORIGINAL_HEIGHT;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            const highlight = isMyTurn && !!selectedTransport && edge.type === selectedTransport && edge.from === currentPlayerObj?.position && filteredValidMoves.has(edge.to);

            const colour = TRANSPORT_COLOURS[edge.type] ?? "#888";
            const lineWidth = highlight ? 4 : 2;
            const opacity = highlight ? 1 : 0.6;
            const isMulti = (nodeDegrees[edge.from] || 0) > 2 || (nodeDegrees[edge.to] || 0) > 2;

            return (
                <View
                    key={`${edge.from}-${edge.to}-${edge.type}`}
                    style={{
                        position: "absolute",
                        left: midX - length / 2,
                        top: midY - lineWidth / 2,
                        width: length,
                        height: lineWidth,
                        backgroundColor: colour,
                        opacity,
                        transform: [{ rotate: `${angle}deg` }],
                        ...(isMulti ? { borderStyle: "dashed" } : {}),
                    }}
                    pointerEvents="none"
                />
            );
        });
}, [nodeDegrees, filteredValidMoves, isMyTurn, currentPlayerObj, selectedTransport]);

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

    if (!mapData) {
        return (
            <View style={styles.container}>
                <View style={styles.statusWrap}>
                    <Text style={styles.statusText}>{mapError ? `Map failed to load:\n${mapError}` : "Loading map…"}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container} {...(Platform.OS === "web" ? { onWheel: handleWheel as any } : {})}>
            <Animated.View
                {...panResponder.panHandlers}
                style={{
                    transform: [{ translateX }, { translateY }, { scale }],
                    // The translateX/Y/scale values are computed assuming a top-left transform
                    // anchor (matching the web app's mapWrapper), but the default anchor is the
                    // element's center — without this, the scaled map ends up positioned far
                    // outside the visible viewport instead of filling it.
                    transformOrigin: "0 0",
                    width: MAP_ORIGINAL_WIDTH,
                    height: MAP_ORIGINAL_HEIGHT,
                }}
            >
                <Image source={{ uri: mapData.mapImage }} style={{ width: MAP_ORIGINAL_WIDTH, height: MAP_ORIGINAL_HEIGHT }} resizeMode="contain" />

                {/* Edge lines */}
                {edgeViews}

                {/* Position nodes. Size is bumped well above the 24px default: on large maps the
                    initial fit-to-screen scale is tiny, so a bigger base size keeps nodes visible
                    and tappable without needing per-frame zoom-compensated sizing. */}
                {MAP_NODES.map((node) => {
                    let highlight: "selected" | "pending" | "inspected" | "hovered" | "none" = "none";
                    if (currentPlayerObj && node.id === currentPlayerObj.position) highlight = "inspected";
                    else if (isMyTurn && filteredValidMoves.has(node.id)) highlight = "pending";
                    return <PositionNode key={node.id} label={node.id} transports={node.transports} x={node.x} y={node.y} size={nodeSize} highlight={highlight} onPress={() => handleNodePress(node.id)} />;
                })}

                {/* Player icons */}
                {Object.entries(playersByPosition).map(([posId, group]) => {
                    const nodeId = parseInt(posId);
                    const node = MAP_NODES.find((n) => n.id === nodeId);
                    if (!node) return null;
                    return <PlayerIcon key={posId} players={group} x={(node.x / 100) * MAP_ORIGINAL_WIDTH} y={(node.y / 100) * MAP_ORIGINAL_HEIGHT} dim={isMyTurn && !!selectedTransport} />;
                })}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1a1a1a",
        overflow: "hidden",
    },
    statusWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    statusText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 14,
        textAlign: "center",
    },
    pickerBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 100,
    },
    pickerContainer: {
        backgroundColor: "#0f0f14",
        borderRadius: 16,
        padding: 20,
        paddingBottom: 14,
        alignItems: "center",
        minWidth: 260,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
    },
    pickerTitle: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    pickerRow: {
        flexDirection: "row",
        gap: 10,
    },
    pickerBtn: {
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: 10,
        minWidth: 60,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.15)",
        gap: 4,
    },
    pickerCount: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
        fontVariant: ["tabular-nums"],
    },
    pickerCancelBtn: {
        marginTop: 10,
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    pickerCancelText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
    },
});
