import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useGameState } from "@packages/providers";
import { InteractiveMap } from "@/components/play/InteractiveMap";
import { TravelLog } from "@/components/play/TravelLog";
import { TransportBar } from "@/components/play/TransportBar";
import { TurnIndicator } from "@/components/play/TurnIndicator";
import EscapeMenu from "@/components/EscapeMenu";
import { apiClient } from "@packages/api";
import { TransportType } from "@packages/types";

export default function Play() {
    const router = useRouter();
    const { game, playerId, setGame } = useGameState();
    const [shownWinMessage, setShownWinMessage] = useState(false);
    const [selectedTransport, setSelectedTransport] = useState<TransportType | null>(null);

    useEffect(() => {
        if (!game || !playerId) {
            router.replace("/welcome");
        }
    }, [game, playerId, router]);

    const currentPlayer = useMemo(() => {
        if (!game) return null;
        return game.players.find((p) => p.id === playerId);
    }, [game, game?.players]);

    const currentTurnPlayer = useMemo(() => {
        if (!game) return null;
        return game.players.find((p) => p.id === game.currentTurn) ?? null;
    }, [game, game?.players, game?.currentTurn]);

    const gameOver = useMemo(() => {
        if (!game) return false;
        return game.status === "finished";
    }, [game]);

    const isMyTurn = !gameOver && !!currentPlayer && currentPlayer.id === game?.currentTurn;

    // Null when nobody specific is "it" for this viewer (e.g. Fugitive during Detectives' turn) — fall back to own player.
    const activeTurnPlayer = currentTurnPlayer ?? currentPlayer ?? null;

    useEffect(() => {
        if (!isMyTurn) {
            setSelectedTransport(null);
        }
    }, [isMyTurn]);

    useEffect(() => {
        if (gameOver && game?.winMessage && !shownWinMessage) {
            if (!currentPlayer) return;
            setShownWinMessage(true);
            alert(game.winMessage);
            router.push("/creategame");
        } else if (!gameOver && shownWinMessage) {
            setShownWinMessage(false);
        }
    }, [gameOver, game?.winMessage, shownWinMessage, currentPlayer]);    


    const handleSurrender = useCallback(async () => {
        if (!game || !playerId) return;
        try {
            await apiClient.surrender(playerId, game.pin);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Surrender failed: ${message}`);
        }
    }, [playerId, game]);

    // x2 has no destination of its own — play it standalone to unlock the next two moves.
    const handleX2 = useCallback(async () => {
        if (!game || !playerId || !currentPlayer) return;
        try {
            await apiClient.makeMove(playerId, game.pin, "x2", currentPlayer.position);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            alert(`x2 failed: ${message}`);
        }
    }, [game, playerId, currentPlayer]);

    const handleTransportSelect = useCallback(
        (t: TransportType) => {
            if (t === "x2") {
                void handleX2();
                return;
            }
            setSelectedTransport((prev) => (prev === t ? null : t));
        },
        [handleX2]
    );

    const handleMove = useCallback(
        async (destination: number, transport: TransportType) => {
            if (!game || !playerId) return;
            try {
                const response: any = await apiClient.makeMove(playerId, game.pin, transport, destination);
                // Server masks our own location, so polls won't reflect this move — apply it locally.
                const newPosition = typeof response?.location === "number" ? response.location : destination;
                setGame((prev) =>
                    prev
                        ? { ...prev, players: prev.players.map((p) => (p.id === playerId ? { ...p, position: newPosition } : p)) }
                        : prev
                );
                setSelectedTransport(null);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                alert(`Move failed: ${message}`);
            }
        },
        [game, playerId, setGame]
    );

    if (!game || !playerId || !currentPlayer || !activeTurnPlayer) return null;

    const showTransportBar = !(activeTurnPlayer.isLecturer && !currentPlayer.isLecturer);
    const turnLabel = currentTurnPlayer
        ? currentTurnPlayer.id === playerId
            ? "Your"
            : `${currentTurnPlayer.name}'s`
        : "Detectives'";

    return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#1a1a1a", overflow: "hidden", position: "fixed" }}>
        <EscapeMenu onNavigateWelcome={() => router.replace("/welcome")} />

        <InteractiveMap
            players={game.players}
            currentRound={game.currentRound}
            isLecturer={currentPlayer.isLecturer}
            gameOver={gameOver}
            gamePin={game.pin}
            currentPlayerId={playerId}
            currentTurn={game.currentTurn}
            selectedTransport={selectedTransport}
            onMove={handleMove}
            mapId={game.mapId}
        />
    {/* Travel log - no interaction needed */}
    <div style={{ position: "fixed", top: 0, left: 0, zIndex: 10, pointerEvents: "none" }}>
        <TravelLog logs={game.travelLog} isLecturer={currentPlayer.isLecturer} gameOver={gameOver} totalRounds={game.totalRounds}/>
    </div>

    {/* Turn indicator - no interaction needed */}
    <div style={{ position: "fixed", top: 0, right: 0, zIndex: 10, pointerEvents: "none" }}>
        <TurnIndicator currentPlayerName={turnLabel} round={game.currentRound} gameOver={gameOver} winMessage={game.winMessage} />
    </div>

    {showTransportBar && (
    <div style={{ 
        position: "fixed", 
        bottom: 0, 
        left: "50%", 
        transform: "translateX(-50%)", 
        zIndex: 9999,
        pointerEvents: "all"
    }}>
        <TransportBar
            player={activeTurnPlayer}
            selectedTransport={selectedTransport}
            onTransportSelect={handleTransportSelect}
            isMyTurn={isMyTurn}
        />
    </div>
)}

    {currentPlayer.isLecturer && isMyTurn && (
    <div style={{ position: "fixed", bottom: 100, right: 20, zIndex: 100 }}>
        <button
            onClick={handleSurrender}
            style={{
                backgroundColor: "rgba(220,50,50,0.9)",
                color: "#fff",
                fontWeight: "800",
                fontSize: 14,
                padding: "10px 20px",
                borderRadius: 10,
                border: "2px solid #000",
                cursor: "pointer",
            }}
        >
            Surrender
        </button>
    </div>
)}

    </div>
);
}