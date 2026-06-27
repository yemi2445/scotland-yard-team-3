import React, { useMemo, useState } from "react";
import { apiClient } from "@packages/api";
import { useGameState } from "@packages/providers";

type Props = {
    onNavigateWelcome: () => void;
};

export default function EscapeMenu({ onNavigateWelcome }: Props) {
    const [open, setOpen] = useState(false);

    const { game, playerId, currentPlayer, setGame, setPlayerId } = useGameState();

    const closeMenu = () => setOpen(false);
    const openMenu = () => setOpen(true);

    const disconnectLocal = () => {
        setGame(null);
        setPlayerId(null);
        closeMenu();
        onNavigateWelcome();
    };

    const confirmWeb = (title: string, message: string) => {
        const g: any = globalThis as any;
        if (typeof g.confirm === "function") {
            return g.confirm(`${title}\n\n${message}`);
        }
        return true;
    };

    const alertWeb = (message: string) => {
        const g: any = globalThis as any;
        if (typeof g.alert === "function") g.alert(message);
    };

    const leaveGame = async () => {
        const ok = confirmWeb("Leave game?", "You will disconnect from the current game.");
        if (!ok) return;

        try {
            if (game?.pin && playerId) {
                await apiClient.leaveGame(game.pin, playerId);
            }
        } catch (e) {
            console.log("Leave error:", e);
        } finally {
            disconnectLocal();
        }
    };

    const endGame = async () => {
        if (!currentPlayer?.isHost) return;

        const ok = confirmWeb("End game for everyone?", "This will close the game for all players.");
        if (!ok) return;

        try {
            if (game?.pin && playerId) {
                await apiClient.endGame(game.pin, playerId);
            }
        } catch (e) {
            console.log("End game error:", e);
            alertWeb("Could not end game (host only or network error): " + String(e));
            return;
        }

        disconnectLocal();
    };

    return (
        <>
            <button type="button" onClick={openMenu} style={styles.escapeButton} aria-label="Open menu">
                ☰
            </button>

            {open && (
                <div style={styles.overlay}>
                    <div style={styles.backdrop} onClick={closeMenu} />

                    <div style={styles.sheet} role="dialog" aria-modal="true">
                        <div style={styles.sheetTitle}>Menu</div>

                        <button type="button" onClick={leaveGame} style={styles.sheetButton}>
                            Leave Game
                        </button>

                        {currentPlayer?.isHost && (
                            <button
                                type="button"
                                onClick={endGame}
                                style={{
                                    ...styles.sheetButton,
                                    ...styles.dangerButton,
                                }}
                            >
                                End Game (Host)
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={closeMenu}
                            style={{
                                ...styles.sheetButton,
                                ...styles.cancelButton,
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

const styles: Record<string, React.CSSProperties> = {
    escapeButton: {
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 5000,
        width: 44,
        height: 44,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        fontSize: 22,
        fontWeight: 800,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 6000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },

    backdrop: {
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
    },

    sheet: {
        position: "relative",
        width: "100%",
        maxWidth: 420,
        borderRadius: 16,
        padding: 16,
        background: "rgba(20,20,20,0.95)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    },

    sheetTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: 900,
        marginBottom: 12,
    },

    sheetButton: {
        width: "100%",
        height: 44,
        borderRadius: 12,
        border: "none",
        marginBottom: 10,
        background: "rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.92)",
        fontSize: 15,
        fontWeight: 800,
        cursor: "pointer",
    },

    dangerButton: {
        background: "rgba(255, 80, 80, 0.18)",
        border: "1px solid rgba(255, 80, 80, 0.35)",
        color: "rgba(255, 200, 200, 0.95)",
    },

    cancelButton: {
        marginTop: 4,
        background: "rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.75)",
    },
};
