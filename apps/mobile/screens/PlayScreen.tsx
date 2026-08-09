import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@packages/ui/src/theme";
import { NavigationProps } from "../App";
import { Player, TransportType, TravelLogEntry } from "@packages/types";
import { TransportBar } from "../components/TransportBar";
import { TurnIndicator } from "../components/TurnIndicator";
import { TravelLog } from "../components/TravelLog";
import InteractiveMap from "../components/InteractiveMap";
import EscapeMenuOverlay from "../components/EscapeMenuOverlay";
import { useGameState } from "@packages/providers";
import { apiClient } from "@packages/api";

export default function PlayScreen({ navigation }: NavigationProps) {
    const { game, playerId } = useGameState();
    const [shownWinMessage, setShownWinMessage] = useState(false);
    const [selectedTransport, setSelectedTransport] = useState<TransportType | null>(null);

    useEffect(() => {
        if (!game || !playerId) {
            navigation.navigate("Welcome");
        }
    }, [game, playerId, navigation]);

    const currentPlayer = useMemo(() => {
        if (!game) return null;
        return game.players.find((p) => p.id === playerId);
    }, [game, game?.players, playerId]);

    const currentTurnPlayer = useMemo(() => {
        if (!game) return null;
        return game.players.find((p) => p.id === game.currentTurn) ?? null;
    }, [game, game?.players, game?.currentTurn]);

    const gameOver = useMemo(() => {
        if (!game) return false;
        return game.status === "finished";
    }, [game]);

    const isMyTurn = !gameOver && !!currentPlayer && currentPlayer.id === game?.currentTurn;

    // currentTurnPlayer is null whenever nobody specific can be identified as "it" from this
    // viewer's perspective (e.g. the Fugitive's client during the Detective phase, since any
    // detective may act). Fall back to the viewer's own player so the bar/label still render.
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
            navigation.navigate("CreateGame");
        } else if (!gameOver && shownWinMessage) {
            setShownWinMessage(false);
        }
    }, [gameOver, game?.winMessage, shownWinMessage, currentPlayer]);

    // x2 has no destination of its own — playing it (at the player's current position) keeps
    // the turn active so the next two ordinary ticket moves can be played, per the game rules.
    // It must be submitted as its own standalone move; the server has no way to combine it with
    // another ticket in a single request.
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

    const handleSurrender = useCallback(async () => {
        if (!game || !playerId) return;
        try {
            await apiClient.surrender(playerId, game.pin);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Surrender failed: ${message}`);
        }
    }, [playerId, game]);

    const handleMove = useCallback(
        async (destination: number, transport: TransportType) => {
            if (!game || !playerId) return;
            try {
                await apiClient.makeMove(playerId, game.pin, transport, destination);
                setSelectedTransport(null);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                alert(`Move failed: ${message}`);
            }
        },
        [game, playerId]
    );

    if (!game || !playerId || !currentPlayer || !activeTurnPlayer) return null;

    const showTransportBar = !(activeTurnPlayer.isLecturer && !currentPlayer.isLecturer);
    const turnLabel = currentTurnPlayer
        ? currentTurnPlayer.id === playerId
            ? "Your"
            : `${currentTurnPlayer.name}'s`
        : "Detectives'";

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <EscapeMenuOverlay onNavigateWelcome={() => navigation.navigate("Welcome")} />
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
                <TravelLog logs={game.travelLog} isLecturer={currentPlayer.isLecturer} gameOver={gameOver} totalRounds={game.totalRounds} />
                <TurnIndicator currentPlayerName={turnLabel} round={game.currentRound} gameOver={gameOver} winMessage={game.winMessage} />
                {showTransportBar && (
                    <TransportBar
                        player={activeTurnPlayer}
                        selectedTransport={selectedTransport}
                        onTransportSelect={handleTransportSelect}
                        isMyTurn={isMyTurn}
                    />
                )}
                {currentPlayer.isLecturer && isMyTurn && (
                    <View style={styles.surrenderContainer}>
                        <Pressable onPress={handleSurrender} style={styles.surrenderButton}>
                            <Text style={styles.surrenderText}>Surrender</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.background,
    },
    content: {
        flex: 1,
    },
    backButtonContainer: {
        position: "absolute",
        bottom: 80,
        left: 20,
    },
    surrenderContainer: {
        position: "absolute",
        bottom: 80,
        right: 20,
    },

    surrenderButton: {
        backgroundColor: "rgba(220,50,50,0.9)",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    surrenderText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 14,
    },

});
