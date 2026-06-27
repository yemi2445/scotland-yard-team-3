import { Game, Move } from "./shared";

export type response = { success: boolean; error?: string };

export interface GetGameResponse extends response {
    game: Game;
}

export interface JoinGameResponse extends response {
    playerId: string;
    game: Game;
}

export interface MakeMoveResponse extends response {
    newState: Move;
}

export interface CreateGameResponse extends response {
    game: Game;
    playerId: string;
}

export interface StartGameResponse extends response {}
export interface StuckGameResponse extends response {}
export interface SpectateGameResponse extends response {
    spectatorModeEnabled: boolean;
}

export interface UpdateGameResponse extends response {
    game: Game;
}

export interface LeaveGameResponse {
    success: true;
    game: Game | null;
}

export interface EndGameResponse {
    success: true;
}
