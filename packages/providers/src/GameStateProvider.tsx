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
                const rawGame: any = await apiClient.getGame(game.pin);

                if (!cancelled) {
                    // Nick's server only exposes a coarse "Fugitive" / "Detective" phase, not a
                    // specific player id. For the Fugitive phase there's exactly one player who can
                    // act, so we can resolve a single id. For the Detective phase any detective may
                    // act, so currentTurn is resolved per-viewer: it's "you" if you're a detective,
                    // otherwise nobody (matches how isMyTurn is checked downstream).
                    const currentTurn =
                        rawGame.state === "Fugitive"
                            ? (rawGame.players ?? []).find((p: any) => p.colour?.toLowerCase() === "clear")?.playerId?.toString() ?? null
                            : rawGame.state === "Detective"
                            ? (rawGame.players ?? []).find((p: any) => p.colour?.toLowerCase() !== "clear" && p.playerId?.toString() === playerId)?.playerId?.toString() ?? null
                            : null;

                    const mapped = {
                        pin: String(rawGame.gameId),
                        mapId: rawGame.mapId,
                        status: (rawGame.state === "Open" ? "waiting" :
                                rawGame.state === "Fugitive" || rawGame.state === "Detective" ? "active" : "finished") as Game["status"],
                        currentTurn,
                        currentRound: rawGame.round ?? 0,
                        totalRounds: rawGame.length ?? 0,
                        winMessage: rawGame.winner !== "None" ? `${rawGame.winner} wins!` : undefined,
                        travelLog: [],
                        players: (rawGame.players ?? []).map((p: any, i: number) => {
                            const parsedLocation = Number(p.location);
                            return {
                                id: String(p.playerId),
                                name: p.playerName,
                                colour: p.colour?.toLowerCase() ?? "clear",
                                isLecturer: p.colour?.toLowerCase() === "clear",
                                isHost: i === 0,
                                position: Number.isFinite(parsedLocation) ? parsedLocation : 0,
                                tickets: {
                                    yellow: typeof p.yellow === "number" ? p.yellow : 0,
                                    green: typeof p.green === "number" ? p.green : 0,
                                    red: typeof p.red === "number" ? p.red : 0,
                                    black: typeof p.black === "number" ? p.black : 0,
                                    x2: typeof p["2x"] === "number" ? p["2x"] : (typeof p.x2 === "number" ? p.x2 : 0),
                                },
                                isSpectator: false,
                            };
                        }),
                    };
                    setGame((prevGame) => {
                        // Keep mapName from previous state since server doesdnt return it
                        const mappedWithName = {
                            ...mapped,
                            mapName: prevGame?.mapName ?? "Mini Map",
                        };
                        if (JSON.stringify(prevGame) != JSON.stringify(mappedWithName)) {
                            return mappedWithName;
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
    }, [game?.pin, playerId, setGame, setPlayerId]);

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
