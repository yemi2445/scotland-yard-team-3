import React, { useEffect, useMemo } from "react"
import { useRouter } from "next/router"
import styles from "../components/Welcome.module.css"
import cg from "../components/CreateGame.module.css"
import { useGameState } from "@packages/providers"
import { getColourHex } from "@packages/utils"
import { apiClient } from "@packages/api"

export default function CreateGame() {
    const router = useRouter();
    const { game, playerId, currentPlayer, setGame, setPlayerId } = useGameState();

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

    const rounds = game?.totalRounds || 0;
    const selectedMapName = game?.mapName ?? "Mini Map";

    const handleStart = async () => {
        if (!game || !playerId) return;
        try {
            await apiClient.startGame(game.pin, playerId)
            router.push("/play");
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Failed to start game: ${message}`);
        }
    };
    

    const handleLeave = () => {
        setGame(null);
        setPlayerId(null);
        router.push("/welcome")
    };

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
                        <div className={cg.mapChips}>
                            <span className={`${cg.mapChip} ${cg.mapChipSelected}`}>
                                {selectedMapName}
                            </span>
                        </div>
                    </div>

                    <div className={cg.roundsRow}>
                        <span className={cg.roundsLabel}>Rounds:</span>
                        <div className={cg.roundsChips}>
                            <span className={`${cg.roundsChip} ${cg.roundsChipSelected}`}>
                                {rounds}
                            </span>
                        </div>
                    </div>
                </div>

                {currentPlayer?.isHost && (
                    <button className={`${styles.button} ${styles.join} ${cg.start}`} onClick={handleStart}>
                        Start Game
                    </button>
                )}

                <button className={`${styles.button} ${cg.leave}`} onClick={handleLeave}>
                    Leave Lobby
                </button>
            </div>
        </div>
    );
}

    






