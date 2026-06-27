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

    for (const edge of mapData.edges) {
        const transport = edge.type;
        if (!tickets[transport] || tickets[transport] <= 0) continue;

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
        if (!usable.includes(transport)) usable.push(transport);
        moves.set(dest, usable);
    }

    return moves;
}
