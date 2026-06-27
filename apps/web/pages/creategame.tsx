import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import styles from "../components/Welcome.module.css";
import cg from "../components/CreateGame.module.css";
import { useGameState } from "@packages/providers";
import { ROUND_OPTIONS, MAX_ROUNDS, getColourHex, DEFAULT_MAP_ID, AVAILABLE_MAPS } from "@packages/utils";
import { apiClient } from "@packages/api";

export default function CreateGame() {
    const router = useRouter();

    const { game, playerId, currentPlayer } = useGameState();
    const [rounds, setRounds] = useState(MAX_ROUNDS);
    const [mapId, setMapId] = useState(DEFAULT_MAP_ID);
    const [spectatorEnabled, setSpectatorEnabled] = useState(false);

    useEffect(() => {
        if (!game || !currentPlayer) return;
        setSpectatorEnabled(currentPlayer.isSpectator || false);
    }, [game, currentPlayer]);

    const players = useMemo(() => {
        if (!game) return [];
        return game.players.map((p) => ({ name: p.name, colour: getColourHex(p.colour) }));
    }, [game]);

    useEffect(() => {
        if (!game) {
            router.push("/welcome");
            return;
        }

        if (game.status === "active") {
            router.push("/play");
        }
    }, [game, router]);

    useEffect(() => {
        if (!game) return;
        setRounds(game.totalRounds || MAX_ROUNDS);
        setMapId(game.mapId || DEFAULT_MAP_ID);
    }, [game]);

    const selectedMapName = useMemo(() => {
        return AVAILABLE_MAPS.find((m) => m.id === mapId)?.name ?? "Unknown map";
    }, [mapId]);

    const updateRounds = (nextRounds: number) => {
        if (!game || !playerId || !currentPlayer?.isHost) return;

        setRounds(nextRounds);
        apiClient.updateGame(game.pin, playerId, { totalRounds: nextRounds }).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Failed to update rounds: ${message}`);
            setRounds(game.totalRounds || MAX_ROUNDS);
        });
    };

    const updateMap = (nextMapId: typeof mapId) => {
        if (!game || !playerId || !currentPlayer?.isHost) return;

        setMapId(nextMapId);
        apiClient.updateGame(game.pin, playerId, { mapId: nextMapId }).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Failed to update map: ${message}`);
            setMapId(game.mapId || DEFAULT_MAP_ID);
        });
    };

    const handleSpectatorToggle = () => {
        if (!currentPlayer?.isHost) return;

        apiClient.setGameSpectator(game!.pin, playerId!).then((response) => {
            setSpectatorEnabled(response.spectatorModeEnabled);
        })
    };

    const createGame = () => {
        if (!game || !playerId) return;
        apiClient.startGame(game.pin, playerId, rounds, mapId).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Failed to start game: ${message}`);
        });
    }

    return (
        <div className={styles.page}>
            <div className={styles.shapes} />

            <div className={styles.content}>
                <h1 className={styles.title}>The Leeds Files - Manhunt</h1>

                <div className={cg.pinRow}>
                    <span className={cg.pinLabel}>Pin:</span>
                    <span className={cg.pinValue}>{game?.pin}</span>
                </div>

                <div className={cg.players}>
                    <div className={cg.playersTitle}>Current Players:</div>
                    <div className={cg.playersList}>
                        {players.map((p) => (
                            <span key={p.name} className={cg.player}>
                                <span className={cg.playerDot} style={{ backgroundColor: p.colour }} />
                                {p.name}
                            </span>
                        ))}
                    </div>
                </div>

                <div className={cg.controlsRow}>
                    <div className={cg.mapRow}>
                        <span className={cg.mapLabel}>Map:</span>
                        {currentPlayer?.isHost ? (
                            <div className={cg.mapChips}>
                                {AVAILABLE_MAPS.map((map) => (
                                    <button
                                        key={map.id}
                                        type="button"
                                        className={`${cg.mapChip} ${mapId === map.id ? cg.mapChipSelected : ""}`}
                                        onClick={() => updateMap(map.id)}
                                    >
                                        {map.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className={cg.mapChips}>
                                <span className={`${cg.mapChip} ${cg.mapChipSelected}`}>{selectedMapName}</span>
                            </div>
                        )}
                    </div>

                    <div className={cg.roundsRow}>
                        <span className={cg.roundsLabel}>Rounds:</span>
                        {currentPlayer?.isHost ? (
                            <div className={cg.roundsChips}>
                                {ROUND_OPTIONS.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        className={`${cg.roundsChip} ${rounds === r ? cg.roundsChipSelected : ""}`}
                                        onClick={() => updateRounds(r)}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className={cg.roundsChips}>
                                <span className={`${cg.roundsChip} ${cg.roundsChipSelected}`}>{rounds}</span>
                            </div>
                        )}
                    </div>
                </div>

                {currentPlayer?.isHost && (
                    <div className={cg.spectatorRow}>
                        <label className={cg.spectatorLabel}>
                            <input
                                type="checkbox"
                                checked={spectatorEnabled}
                                onChange={handleSpectatorToggle}
                            />
                            Spectator Mode
                        </label>
                    </div>
                )}

                {currentPlayer?.isHost && (
                    <button className={`${styles.button} ${styles.join} ${cg.start}`} onClick={createGame}>
                        Start Game
                    </button>
                )}
            </div>
        </div>
    );
}
