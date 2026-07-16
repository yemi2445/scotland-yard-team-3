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
import { SECONDARY_TRANSPORTS } from "@packages/utils";

export default function Play() {
    const router = useRouter();
    const { game, playerId } = useGameState();
    const [shownWinMessage, setShownWinMessage] = useState(false);
    const [selectedTransport, setSelectedTransport] = useState<TransportType | null>(null);
    const [selectedSecondaryTransport, setSelectedSecondaryTransport] = useState<TransportType | null>(null);

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

    useEffect(() => {
        if (!isMyTurn) {
            setSelectedTransport(null);
            setSelectedSecondaryTransport(null);
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


    const handleTransportSelect = useCallback((t: TransportType) => {
        if (SECONDARY_TRANSPORTS.includes(t)) {
            setSelectedSecondaryTransport((prev) => (prev === t ? null : t));
        } else {
            setSelectedTransport((prev) => (prev === t ? null : t));
        }
    }, []);

    const handleMove = useCallback(
        async (destination: number, transport: TransportType) => {
            if (!game || !playerId) return;
            try {
                await apiClient.makeMove(game.pin, playerId, {
                    playerId,
                    transport,
                    destination,
                    ...(selectedSecondaryTransport ? { secondaryTransport: selectedSecondaryTransport } : {}),
                });
                setSelectedTransport(null);
                setSelectedSecondaryTransport(null);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                alert(`Move failed: ${message}`);
            }
        },
        [game, playerId, selectedSecondaryTransport]
    );

    if (!game || !playerId || !currentPlayer || !currentTurnPlayer) return null;

    const showTransportBar = !(currentTurnPlayer.isLecturer && !currentPlayer?.isLecturer);

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
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
            <TravelLog logs={game.travelLog} isLecturer={currentPlayer.isLecturer} gameOver={gameOver} totalRounds={game.totalRounds}/>

            <TurnIndicator currentPlayerName={currentTurnPlayer.id === playerId ? "Your" : `${currentTurnPlayer.name}'s`} round={game.currentRound} gameOver={gameOver} winMessage={game.winMessage} />
            {showTransportBar && (
                <TransportBar
                    player={currentTurnPlayer}
                    selectedTransport={selectedTransport}
                    selectedSecondaryTransport={selectedSecondaryTransport}
                    onTransportSelect={handleTransportSelect}
                    isMyTurn={isMyTurn}
                />
            )}
            {currentPlayer.isLecturer && isMyTurn && (
    <div style={{
        position: "fixed",
        bottom: 100,
        right: 20,
        zIndex: 100,
    }}>
        <button
            onClick={async () => {
                try {
                    await apiClient.surrender(playerId, game.pin);
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    alert(`Surrender failed: ${message}`);
                }
            }}
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