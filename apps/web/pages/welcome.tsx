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
    const [mode, setMode] = useState<"create" | "join">("create");

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

    const createClicked = async() => {
        try {
            if (name.trim().length === 0) {
                alert("Please enter your name before creating a game");
                return;
            }

            // Step 1: Create game
            const createResponse: any = await apiClient.createGame(name, 567, "short");
            const gameId = createResponse.gameId;

            // Step 2: Join as fugitive
            const joinResponse: any = await apiClient.joinGame(gameId, name);
            const playerId = String(joinResponse.playerId);

            // Step 3: Fetch game state
            const rawGame: any = await apiClient.getGame(gameId);
            const mapData: any = await apiClient.getMap(rawGame.mapId)

            const game: any = {
                pin: String(rawGame.gameId),
                mapId: rawGame.mapId,
                mapName: mapData?.mapName ?? "Mini Map",
                status: "waiting",
                currentTurn: null,
                currentRound: rawGame.round ?? 0,
                totalRounds: rawGame.length ?? 0,
                winMessage: null,
                travelLog: [],
                players: (rawGame.players ?? []).map((p: any, i: number) => ({
                    id: String(p.playerId),
                    name: p.playerName,
                    colour: p.colour?.toLowerCase() ?? "clear",
                    isLecturer: p.colour?.toLowerCase() === "clear",
                    isHost: i === 0,
                    position: typeof p.location === "number" ? p.location : 0,
                    tickets: { yellow: 0, green: 0, red: 0, black: 0, x2: 0 },
                    isSpectator: false,
            })),
        };

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
                <div className={styles.label}>Enter Your Name:</div>
                <input className={styles.pin} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />

                {mode === "join" && (
                    <>
                        <div className={styles.label}>Enter Game Pin:</div>
                        <input className={styles.pin} inputMode="numeric" placeholder="000-000" value={pin} onChange={(e) => setPin(formatGamePin(e.target.value))} />
                    </>
                )}

                <button type="button" className={styles.colourChipCenter} onClick={() => setColourOpen(true)}>
                    <span className={styles.colourSwatch} style={{ backgroundColor: selectedHex }} />
                    <span className={styles.colourChipText}>Colour</span>
                    <span className={styles.colourChevron}>▾</span>
                </button>
            </div>
        </div>

        <div className={styles.bottom3}>
            <button className={`${styles.button} ${styles.instructions}`} onClick={() => router.push("/instructions")}>
                Instructions
            </button>

            {mode === "create" ? (
                <>
                    <button className={`${styles.button} ${styles.join}`} onClick={() => setMode("join")}>
                        Join Game
                    </button>
                    <button className={`${styles.button} ${styles.create}`} onClick={createClicked}>
                        Create Game
                    </button>
                </>
            ) : (
                <>
                    <button className={`${styles.button} ${styles.join}`} onClick={() => setMode("create")}>
                        Back
                    </button>
                    <button className={`${styles.button} ${styles.create}`} disabled={!canJoin} onClick={joinClicked}>
                        Confirm Join
                    </button>
                </>
            )}
        </div>

        {/* Colour picker modal */}
        {colourOpen && (
            <div className={styles.modalBackdrop} role="presentation" onClick={() => setColourOpen(false)}>
                <div className={styles.modalPanel} role="dialog" onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalTitle}>Choose a colour</div>
                    <div className={styles.colourGrid}>
                        {PLAYER_COLOURS.map((c) => {
                            const selected = c.key === colour;
                            return (
                                <button key={c.key} type="button"
                                    className={`${styles.colourOptionWrap} ${selected ? styles.colourOptionSelected : ""}`}
                                    onClick={() => { setColour(c.key); setColourOpen(false); }}>
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
