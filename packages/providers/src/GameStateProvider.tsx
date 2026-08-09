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
                // /games/{id} omits ticket counts and always masks our own location — fetch our
                // own player record too for real tickets and a position fallback.
                const self: any = playerId ? await apiClient.getPlayer(playerId).catch(() => null) : null;

                if (!cancelled) {
                    // Server only exposes a coarse Fugitive/Detective phase, not a specific actor id.
                    // Fugitive phase has one actor; Detective phase resolves per-viewer (you, if you're a detective).
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
                            const isSelf = String(p.playerId) === playerId;
                            const ticketSource = isSelf && self ? self : p;
                            const parsedLocation = Number(isSelf && self ? self.location : p.location);
                            return {
                                id: String(p.playerId),
                                name: p.playerName,
                                colour: p.colour?.toLowerCase() ?? "clear",
                                isLecturer: p.colour?.toLowerCase() === "clear",
                                isHost: i === 0,
                                position: Number.isFinite(parsedLocation) ? parsedLocation : 0,
                                tickets: {
                                    yellow: typeof ticketSource.yellow === "number" ? ticketSource.yellow : 0,
                                    green: typeof ticketSource.green === "number" ? ticketSource.green : 0,
                                    red: typeof ticketSource.red === "number" ? ticketSource.red : 0,
                                    black: typeof ticketSource.black === "number" ? ticketSource.black : 0,
                                    x2: typeof ticketSource["2x"] === "number" ? ticketSource["2x"] : (typeof ticketSource.x2 === "number" ? ticketSource.x2 : 0),
                                },
                                isSpectator: false,
                            };
                        }),
                    };
                    setGame((prevGame) => {
                        // Server doesn't return mapName — keep it from previous state.
                        const mappedWithName = {
                            ...mapped,
                            mapName: prevGame?.mapName ?? "Mini Map",
                            // Masked position comes back as 0 — fall back to the last known real one.
                            players: mapped.players.map((p: Player) => {
                                if (p.position !== 0 || p.id !== playerId) return p;
                                const prevSelf = prevGame?.players.find((pp: Player) => pp.id === playerId);
                                return prevSelf && prevSelf.position !== 0 ? { ...p, position: prevSelf.position } : p;
                            }),
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
