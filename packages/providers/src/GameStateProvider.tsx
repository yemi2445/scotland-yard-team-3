import React, { Dispatch, SetStateAction, createContext, useContext, useEffect, useMemo, useState } from "react";
import { Game, Player } from "@packages/types";
import { apiClient } from "@packages/api";

export interface GameStateValue {
    game: Game | null;
    playerId: string | null;
    currentPlayer: Player | null;
    setGame: Dispatch<SetStateAction<Game | null>>;
    setPlayerId: Dispatch<SetStateAction<string | null>>;
}

export const GameStateContext = createContext<GameStateValue | undefined>(undefined);

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [game, setGame] = useState<Game | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);

    useEffect(() => {
        if (!game?.pin) return;

        let cancelled = false;

        const poll = async () => {
            try {
                const response = await apiClient.getGame(game.pin);

                if (!cancelled && response.success) {
                    setGame((prevGame) => {
                        if (JSON.stringify(prevGame) !== JSON.stringify(response.game)) {
                            return response.game;
                        }
                        return prevGame;
                    });
                }
            } catch (err: any) {
                const msg = String(err?.message ?? err);

                if (msg.includes("not found") || msg.includes("404")) {
                    console.log("[GameState] Game ended (404). Clearing local state.");
                    if (!cancelled) {
                        setGame(null);
                        setPlayerId(null);
                    }
                    return;
                }

                console.error("[GameState] Polling error:", err);
            }
        };

        void poll();

        const intervalId = setInterval(() => {
            void poll();
        }, 500);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [game?.pin, setGame, setPlayerId]);

    const currentPlayer = useMemo(() => {
        if (!game || !playerId) return null;
        return game.players.find((p) => p.id === playerId) ?? null;
    }, [game, playerId]);

    const value = useMemo(
        () => ({
            game,
            playerId,
            currentPlayer,
            setGame,
            setPlayerId,
        }),
        [game, playerId, currentPlayer, setGame, setPlayerId]
    );

    return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
};

export const useGameState = (): GameStateValue => {
    const ctx = useContext(GameStateContext);
    if (!ctx) {
        throw new Error("useGameState must be used within a GameStateProvider");
    }
    return ctx;
};
