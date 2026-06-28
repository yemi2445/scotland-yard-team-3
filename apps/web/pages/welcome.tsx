import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";
import styles from "../components/Welcome.module.css";
import { ALLOWED_PLAYER_COLOURS, formatGamePin, getColourHex, isValidGamePin, PLAYER_COLOURS, PlayerColour } from "@packages/utils";
import { apiClient } from "@packages/api";
import { useGameState } from "@packages/providers";

export default function Welcome() {
    const router = useRouter();
    const { setPlayerId, setGame } = useGameState();

    const [pin, setPin] = useState("");
    const [name, setName] = useState("");
    const [colour, setColour] = useState<PlayerColour>(ALLOWED_PLAYER_COLOURS[Math.floor(Math.random() * ALLOWED_PLAYER_COLOURS.length)]);
    const [colourOpen, setColourOpen] = useState(false);

    const canJoin = useMemo(() => {
        return isValidGamePin(pin) && name.trim() !== "" && colour.length > 0;
    }, [pin, name, colour]);

    const joinClicked = async () => {
        if (!canJoin) return;

        try {
            const gamePin = formatGamePin(pin).replace("-","");

            // Backend v1: colour is now sent in the join payload
            const response = await apiClient.joinGame(gamePin, name);
            if (!response.playerId) {
                alert("Failed to join game — no player ID returned.");
                return;
            }

            setGame(response.game);
            setPlayerId(response.playerId);

            if (response.game.status == "active") {
                router.push("/play");
            } else {
                router.push("/creategame");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const lower = message.toLowerCase();

            if (lower.includes("colour") && lower.includes("taken")) {
                alert("That colour is already taken. Please choose another.");
                setColourOpen(true);
                return;
            }

            if (lower.includes("name") && lower.includes("taken")) {
                alert("That name is already taken in this lobby. Please choose another.");
                return;
            }
            
            if (lower.includes("full")) {
                alert("This lobby is full.");
                return;
            }
            
            if (lower.includes("not accepting")) {
                alert("This game has already started.");
                return;
            }

            if (lower.includes("invalid colour")) {
                alert("That colour selection isn’t valid. Please choose again.");
                setColourOpen(true);
                return;
            }

            alert(`Failed to join game. Reason: ${message}`);
        }
    };

    const createClicked = async () => {
        try {
            if (name.trim().length === 0) {
                alert("Please enter your name before creating a game.");
                return;
            }

            // Backend v1: colour is now sent in the create payload
            const { game, playerId } = await apiClient.createGame(name, 1, "short");

            setPlayerId(playerId);
            setGame(game);
            router.push("/creategame");
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Error connecting to backend. Reason: ${message}`);
        }
    };

    const selectedHex = getColourHex(colour);

    return (
        <div className={styles.page}>
            <div className={styles.shapes} />

            <div className={styles.content}>
                <h1 className={styles.title}>The Leeds Files - Manhunt</h1>

                <div className={styles.center}>
                    <div className={styles.label}>Enter game pin:</div>
                    <input className={styles.pin} inputMode="numeric" placeholder="000-000" value={pin} onChange={(e) => setPin(formatGamePin(e.target.value))} />

                    <div className={styles.label}>Enter your name:</div>
                    <input className={styles.pin} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />

                    {/* Colour dropdown button (centered where Join button used to be) */}
                    <button type="button" className={styles.colourChipCenter} onClick={() => setColourOpen(true)} aria-label="Select colour">
                        <span className={styles.colourSwatch} style={{ backgroundColor: selectedHex }} />
                        <span className={styles.colourChipText}>Colour</span>
                        <span className={styles.colourChevron}>▾</span>
                    </button>
                </div>
            </div>

            {/* Bottom row: Instructions | Join Game | Create Game */}
            <div className={styles.bottom3}>
                <button className={`${styles.button} ${styles.instructions}`} onClick={() => router.push("/instructions")}>
                    Instructions
                </button>

                <button className={`${styles.button} ${styles.join}`} disabled={!canJoin} onClick={joinClicked}>
                    Join Game
                </button>

                <button className={`${styles.button} ${styles.create}`} onClick={createClicked}>
                    Create Game
                </button>
            </div>

            {/* Colour picker modal */}
            {colourOpen && (
                <div className={styles.modalBackdrop} role="presentation" onClick={() => setColourOpen(false)}>
                    <div className={styles.modalPanel} role="dialog" aria-modal="true" aria-label="Choose a colour" onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalTitle}>Choose a colour</div>

                        <div className={styles.colourGrid}>
                            {PLAYER_COLOURS.map((c) => {
                                const selected = c.key === colour;

                                return (
                                    <button
                                        key={c.key}
                                        type="button"
                                        className={`${styles.colourOptionWrap} ${selected ? styles.colourOptionSelected : ""}`}
                                        onClick={() => {
                                            setColour(c.key);
                                            setColourOpen(false);
                                        }}
                                        aria-label={`Select colour ${c.key}`}
                                    >
                                        <span className={styles.colourOption} style={{ backgroundColor: c.hex }} />
                                    </button>
                                );
                            })}
                        </div>

                        <button type="button" className={styles.modalCloseButton} onClick={() => setColourOpen(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
