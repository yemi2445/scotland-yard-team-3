import { Player, TransportType } from "@packages/types";

export interface TransportEdge {
    from: number;
    to: number;
    type: TransportType;
}

export interface MapNode {
    id: number;
    x: number;
    y: number;
    transports: TransportType[];
}

export interface MapData {
    nodes: MapNode[];
    edges: TransportEdge[];
}

export function getNodeById(mapData: MapData, id: number): MapNode | undefined {
    return mapData.nodes.find((node) => node.id === id);
}

export function doesEdgeExist(mapData: MapData, from: number, to: number, transport?: TransportType): boolean {
    return mapData.edges.some((edge) => {
        const matchesDirection = (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from);
        if (!matchesDirection) return false;
        if (transport) {
            return edge.type === transport;
        }
        return true;
    });
}

export function getValidMoves(mapData: MapData, playerPosition: number, tickets: Record<TransportType, number>, players: Player[]): Map<number, TransportType[]> {
    const moves = new Map<number, TransportType[]>();
    // Black tickets work on any connection regardless of its real transport type (there is no
    // edge literally typed "black" in the map data), so every adjacent edge is black-eligible.
    const hasBlack = (tickets.black ?? 0) > 0;

    for (const edge of mapData.edges) {
        let dest: number | null = null;
        if (edge.from === playerPosition) {
            dest = edge.to;
        } else if (edge.to === playerPosition) {
            dest = edge.from;
        }

        if (dest === null) continue;

        // Check if any player is currently on the destination node (except for the lecturer, who can be moved onto)
        const occupiedByPlayer = players.some((p) => p.position === dest && !p.isLecturer && !p.isSpectator);
        if (occupiedByPlayer) continue;

        const usable = moves.get(dest) ?? [];
        if ((tickets[edge.type] ?? 0) > 0 && !usable.includes(edge.type)) usable.push(edge.type);
        if (hasBlack && !usable.includes("black")) usable.push("black");
        if (usable.length > 0) moves.set(dest, usable);
    }

    return moves;
}
