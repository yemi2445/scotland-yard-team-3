export const MAX_PLAYERS = 6;

export function createRandomPlayerId(): string {
    return Math.random().toString(36).substr(2, 9);
}

export const PLAYER_COLOURS = [
    { key: "red", hex: "#D32F2F" },
    { key: "blue", hex: "#3498DB" },
    { key: "green", hex: "#2ECC71" },
    { key: "yellow", hex: "#F1C40F" },
    { key: "purple", hex: "#9B59B6" },
    { key: "orange", hex: "#E67E22" },
]

export function getColourHex(key: string): string {
    return PLAYER_COLOURS.find((c) => c.key === key)?.hex ?? PLAYER_COLOURS[0].hex;
}

export const ALLOWED_PLAYER_COLOURS = PLAYER_COLOURS.map(c => c.key);

export type PlayerColour = (typeof ALLOWED_PLAYER_COLOURS)[number];