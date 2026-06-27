import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@packages/api";
import { useGameState } from "@packages/providers";

type Props = {
    onNavigateWelcome: () => void;
};

export default function EscapeMenuOverlay({ onNavigateWelcome }: Props) {
    const [menuOpen, setMenuOpen] = useState(false);

    const { game, playerId, currentPlayer, setGame, setPlayerId } = useGameState();

    const closeMenu = () => setMenuOpen(false);
    const openMenu = () => setMenuOpen(true);

    const disconnectLocal = () => {
        setGame(null);
        setPlayerId(null);
        closeMenu();
        onNavigateWelcome();
    };

    const webConfirm = (title: string, message: string) => {
        return globalThis.confirm?.(`${title}\n\n${message}`) ?? true;
    };

    const webAlert = (message: string) => {
        globalThis.alert?.(message);
    };

    const leaveGame = () => {
        const run = async () => {
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

        if (Platform.OS === "web") {
            const ok = webConfirm("Leave game?", "You will disconnect from the current game.");
            if (ok) void run();
            return;
        }

        Alert.alert("Leave game?", "You will disconnect from the current game.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Leave",
                style: "destructive",
                onPress: () => void run(),
            },
        ]);
    };

    const endGame = () => {
        if (!currentPlayer?.isHost) return;

        const run = async () => {
            try {
                if (game?.pin && playerId) {
                    await apiClient.endGame(game.pin, playerId);
                }
            } catch (e) {
                console.log("End game error:", e);

                if (Platform.OS === "web") {
                    webAlert("Could not end game (host only or network error): " + String(e));
                } else {
                    Alert.alert("Could not end game", "Server rejected the request (host only) or there was a network error.");
                }
                return;
            }

            // when game is ended, players will be kicked out
            disconnectLocal();
        };

        if (Platform.OS === "web") {
            const ok = webConfirm("End game for everyone?", "This will close the game for all players.");
            if (ok) void run();
            return;
        }

        Alert.alert("End game for everyone?", "This will close the game for all players.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "End Game",
                style: "destructive",
                onPress: () => void run(),
            },
        ]);
    };

    return (
        <>
            <Pressable onPress={openMenu} style={({ pressed }) => [styles.escapeButton, pressed && styles.pressedDown]}>
                <Ionicons name="settings-outline" size={22} color="#fff" />
            </Pressable>

            {menuOpen && (
                <View style={styles.overlay} pointerEvents="box-none">
                    <Pressable style={styles.backdrop} onPress={closeMenu} />

                    <View style={styles.sheet} pointerEvents="auto">
                        <Text style={styles.sheetTitle}>Menu</Text>

                        <Pressable style={({ pressed }) => [styles.sheetButton, pressed && styles.pressedDown]} onPress={leaveGame}>
                            <Text style={styles.sheetButtonText}>Leave Game</Text>
                        </Pressable>

                        {currentPlayer?.isHost && (
                            <Pressable style={({ pressed }) => [styles.sheetButton, styles.dangerButton, pressed && styles.pressedDown]} onPress={endGame}>
                                <Text style={styles.dangerText}>End Game (Host)</Text>
                            </Pressable>
                        )}

                        <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.pressedDown]} onPress={closeMenu}>
                            <Text style={styles.cancelText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    escapeButton: {
        position: "absolute",
        bottom: 16,
        right: 16,
        zIndex: 50,
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: "rgba(0,0,0,0.55)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: "center",
        alignItems: "center",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.55)",
    },
    sheet: {
        width: "86%",
        maxWidth: 420,
        borderRadius: 16,
        padding: 16,
        backgroundColor: "rgba(20,20,20,0.95)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
    },
    sheetTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 12,
    },
    sheetButton: {
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.12)",
        marginBottom: 10,
    },
    sheetButtonText: {
        color: "rgba(255,255,255,0.92)",
        fontSize: 15,
        fontWeight: "800",
    },
    dangerButton: {
        backgroundColor: "rgba(255, 80, 80, 0.18)",
        borderWidth: 1,
        borderColor: "rgba(255, 80, 80, 0.35)",
    },
    dangerText: {
        color: "rgba(255, 200, 200, 0.95)",
        fontSize: 15,
        fontWeight: "900",
    },
    cancelButton: {
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
        marginTop: 4,
    },
    cancelText: {
        color: "rgba(255,255,255,0.75)",
        fontWeight: "700",
    },
    pressedDown: {
        transform: [{ translateY: 1 }],
        opacity: 0.98,
    },
});
