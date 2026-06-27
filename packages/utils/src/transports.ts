import { TransportType } from "@packages/types";

export const TRANSPORT_ORDER = ["bike", "taxi", "bus", "black", "x2"];
export const SECONDARY_TRANSPORTS = ["black", "x2"];
export const sortTransports = (a: [string, number], b: [string, number]): number => {
    return TRANSPORT_ORDER.indexOf(a[0]) - TRANSPORT_ORDER.indexOf(b[0]);
};

export const TRANSPORT_COLOURS: Record<TransportType, string> = {
    taxi: "#ffd700",
    bus: "#32cd32",
    bike: "#1e90ff",
    black: "#aaaaaa",
    x2: "#00aaff",
}


export const TRAVEL_LOG_MAX_ENTRIES = 24;
export const LECTURER_MUST_REVEAL_TURNS = [3, 8, 13, 18, 24]; // diff of 5 starts at 3, future ideas of maybe more turns and reveal every 5 turns
