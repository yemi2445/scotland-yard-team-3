import { Game } from "@packages/types";
import { ALLOWED_PLAYER_COLOURS, createRandomPlayerId, MAX_PLAYERS, PlayerColour } from "@packages/utils";

export function CreatePlayerId(game?: Game): string | null {
    for (let i = 0; i < MAX_PLAYERS; i++) {
        const playerId = createRandomPlayerId();
        if (!game || !game.players.find((p) => p.id === playerId)) {
            return playerId;
        }
    }
    return null; // In the extremely unlikely event that all player IDs are taken, return null (should be handled by caller)
}

export function isAllowedColour(colour: string): colour is PlayerColour {
    return (ALLOWED_PLAYER_COLOURS as readonly string[]).includes(colour);
}

export function isColourTaken(game: Game, colour: PlayerColour): boolean {
    return game.players.some((p) => (p.colour ?? "").toLowerCase() === colour);
}

export function GetBlankTickets() {
    return { bike: 0, taxi: 0, bus: 0, black: 0, x2: 0 };
}

export function GetTicketsForRole(isLecturer: boolean, numPlayers: number, maxRounds: number) {
    if (isLecturer) {
        return { bike: maxRounds, taxi: maxRounds, bus: maxRounds, black: 5, x2: 2 };
    }

    if (numPlayers <= 3) {
        return { bike: 22, taxi: 16, bus: 8, black: 0, x2: 0 };
    }

    return { bike: 11, taxi: 8, bus: 4, black: 0, x2: 0 };
}
