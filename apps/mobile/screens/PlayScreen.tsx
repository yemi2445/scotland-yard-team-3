import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@packages/ui/src/theme";
import { Button } from "@packages/ui/src/Button";
import { NavigationProps } from "../App";
import { Player, TransportType, TravelLogEntry } from "@packages/types";
import { TransportBar } from "../components/TransportBar";
import { TurnIndicator } from "../components/TurnIndicator";
import { TravelLog } from "../components/TravelLog";
import InteractiveMap from "../components/InteractiveMap";
import EscapeMenuOverlay from "../components/EscapeMenuOverlay";
import { useGameState } from "@packages/providers";
import { apiClient } from "@packages/api";
import { SECONDARY_TRANSPORTS } from "@packages/utils";

export default function PlayScreen({ navigation }: NavigationProps) {
    const { game, playerId } = useGameState();
    const [shownWinMessage, setShownWinMessage] = useState(false);
    const [selectedTransport, setSelectedTransport] = useState<TransportType | null>(null);
    const [selectedSecondaryTransport, setSelectedSecondaryTransport] = useState<TransportType | null>(null);

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

    const handleSurrender = useCallback(
        async () => {
            if (!game || !playerId) return;
            try {
                await apiClient.surrender(playerId, game.pin);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                alert(`Surrender failed: ${message}`);
            }
           },
            [playerId, game]
        );
        
    if (!game || !playerId || !currentPlayer || !currentTurnPlayer) return null;

    const showTransportBar = !(currentTurnPlayer.isLecturer && !currentPlayer.isLecturer);
    
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
                    <View style={styles.surrenderContainer}>
                        <Button onPress={handleSurrender} label="Surrender" />
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
});
