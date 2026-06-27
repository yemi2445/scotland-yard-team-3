import { MapId } from "@packages/utils";

export interface Game {
    pin: string;
    players: Player[];
    currentTurn?: string; // player ID of the current turn
    currentRound: number;
    totalRounds: number;
    mapId: MapId;
    status: "waiting" | "active" | "finished";
    winMessage?: string;
    travelLog: TravelLogEntry[];
}

export type TransportType = "bike" | "taxi" | "bus" | "black" | "x2";

export interface Player {
    id: string;
    name: string;
    isLecturer: boolean;
    isHost: boolean;
    isSpectator?: boolean;
    isMock?: boolean;
    position: number;
    tickets: Record<TransportType, number>;
    colour: string;
}

export interface TravelLogEntry {
    turn: number;
    transport: TransportType;
    secondaryTransport?: TransportType; // For x2 moves and black tickets, so secondaryTransport: x2, transport: taxi or actual transport used
    position: number;
    isRevealed: boolean;
    isTransportHidden: boolean; // For black tickets, to indicate that the transport type is hidden (only revealed as "black" in the log)
}

export interface Move {
    playerId: string;
    transport: TransportType;
    secondaryTransport?: TransportType; // For x2 moves and black tickets, so secondaryTransport: x2, transport: taxi or actual transport used
    destination: number;
}
