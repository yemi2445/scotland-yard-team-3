import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";
import styles from "../components/Welcome.module.css";
import { formatGamePin, isValidGamePin } from "@packages/utils";
import { apiClient } from "@packages/api";
import { useGameState } from "@packages/providers";

export default function Welcome() {
    const router = useRouter();
    const { setPlayerId, setGame } = useGameState();

    const [pin, setPin] = useState("");
    const [name, setName] = useState("");
    const [mode, setMode] = useState<"create" | "join">("create");

    const canJoin = useMemo(() => {
        return isValidGamePin(pin) && name.trim() !== "";
    }, [pin, name]);

    const joinClicked = async () => {
        if (!canJoin) return;

        try {
            const gamePin = formatGamePin(pin).replace("-","");

            const response: any = await apiClient.joinGame(gamePin, name);
            if (!response.playerId) {
                alert("Failed to join game — no player ID returned.");
                return;
            }

            const playerId = String(response.playerId);
            const rawGame: any = await apiClient.getGame(gamePin);
            const mapData: any = await apiClient.getMap(rawGame.mapId);

            const game: any = {
                pin: String(rawGame.gameId),
                mapId: rawGame.mapId,
                mapName: mapData?.mapName ?? "Mini Map",
                status: rawGame.state === "Open" ? "waiting" : rawGame.state === "Fugitive" || rawGame.state === "Detective" ? "active" : "finished",
                currentTurn: null,
                currentRound: rawGame.round ?? 0,
                totalRounds: rawGame.length ?? 0,
                winMessage: null,
                travelLog: [],
                players: (rawGame.players ?? []).map((p: any, i: number) => {
                    // Server hides the fugitive's own location outside reveal rounds — startLocation
                    // from the join response is the only source of truth for our real position.
                    const parsedLocation = Number(p.location);
                    const isSelf = String(p.playerId) === playerId;
                    const fallback = isSelf && typeof response.startLocation === "number" ? response.startLocation : 0;
                    return {
                        id: String(p.playerId),
                        name: p.playerName,
                        colour: p.colour?.toLowerCase() ?? "clear",
                        isLecturer: p.colour?.toLowerCase() === "clear",
                        isHost: i === 0,
                        position: Number.isFinite(parsedLocation) ? parsedLocation : fallback,
                        tickets: { yellow: 0, green: 0, red: 0, black: 0, x2: 0 },
                        isSpectator: false,
                    };
                }),
            };

            setPlayerId(playerId);
            setGame(game);

            if (game.status === "active") {
                router.push("/play");
            } else {
                router.push("/creategame");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const lower = message.toLowerCase();

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
                players: (rawGame.players ?? []).map((p: any, i: number) => {
                    // Server hides the fugitive's own location outside reveal rounds — startLocation
                    // from the join response is the only source of truth for our real position.
                    const parsedLocation = Number(p.location);
                    const isSelf = String(p.playerId) === playerId;
                    const fallback = isSelf && typeof joinResponse.startLocation === "number" ? joinResponse.startLocation : 0;
                    return {
                        id: String(p.playerId),
                        name: p.playerName,
                        colour: p.colour?.toLowerCase() ?? "clear",
                        isLecturer: p.colour?.toLowerCase() === "clear",
                        isHost: i === 0,
                        position: Number.isFinite(parsedLocation) ? parsedLocation : fallback,
                        tickets: { yellow: 0, green: 0, red: 0, black: 0, x2: 0 },
                        isSpectator: false,
                    };
            }),
        };

        setPlayerId(playerId);
        setGame(game);
        router.push("/creategame");
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Error connecting to backend. Reason: ${message}`);
        }

    };
    

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
    </div>
);
}
