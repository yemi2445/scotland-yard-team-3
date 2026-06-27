import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import type { NavigationProps } from "../App";
import { useGameState } from "@packages/providers";
import { ROUND_OPTIONS, MAX_ROUNDS, getColourHex, DEFAULT_MAP_ID, AVAILABLE_MAPS } from "@packages/utils";
import { apiClient } from "@packages/api";

export default function CreateGameScreen({ navigation }: NavigationProps) {
    const { game, playerId, currentPlayer } = useGameState();
    const [rounds, setRounds] = useState(MAX_ROUNDS);
    const [mapId, setMapId] = useState(DEFAULT_MAP_ID);

    const players = useMemo(() => {
        if (!game) return [];
        return game.players.map((p) => ({ name: p.name, colour: getColourHex(p.colour) }));
    }, [game]);

    const [fontsLoaded] = useFonts({
        Pacifico: Pacifico_400Regular,
    });

    useEffect(() => {
        if (!game) {
            navigation.navigate("Welcome");
            return;
        }

        if (game.status === "active") {
            navigation.navigate("Play");
        }
    }, [game, navigation]);

    useEffect(() => {
        if (!game) return;
        setRounds(game.totalRounds || MAX_ROUNDS);
        setMapId(game.mapId || DEFAULT_MAP_ID);
    }, [game]);

    const selectedMapName = useMemo(() => {
        return AVAILABLE_MAPS.find((m) => m.id === mapId)?.name ?? "Unknown map";
    }, [mapId]);

    const updateRounds = (nextRounds: number) => {
        if (!game || !playerId || !currentPlayer?.isHost) return;

        setRounds(nextRounds);
        apiClient.updateGame(game.pin, playerId, { totalRounds: nextRounds }).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Failed to update rounds: ${message}`);
            setRounds(game.totalRounds || MAX_ROUNDS);
        });
    };

    const updateMap = (nextMapId: typeof mapId) => {
        if (!game || !playerId || !currentPlayer?.isHost) return;

        setMapId(nextMapId);
        apiClient.updateGame(game.pin, playerId, { mapId: nextMapId }).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Failed to update map: ${message}`);
            setMapId(game.mapId || DEFAULT_MAP_ID);
        });
    };

    const createGame = () => {
        if (!game || !playerId) return;
        apiClient.startGame(game.pin, playerId, rounds, mapId).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Failed to start game: ${message}`);
        });
    }

    if (!fontsLoaded) return null;

    return (
        <LinearGradient colors={["#6f8c59", "#2f4f2f", "#3f3f3f"]} style={styles.background}>
            {/* Background shapes */}
            <View pointerEvents="none" style={styles.shapes}>
                <View style={[styles.shape, styles.shapeTopRight]} />
                <View style={[styles.shape, styles.shapeLeft]} />
                <View style={[styles.shape, styles.shapeBottomRight]} />
                <View style={styles.diagonalPlate} />
            </View>

            <SafeAreaView style={styles.safe} edges={["bottom"]}>
                <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <StatusBar style="light" translucent backgroundColor="transparent" />

                <View style={styles.layout}>
                    {/* Title */}
                    <View style={styles.top}>
                        <View style={styles.titleWrap}>
                            <Text style={styles.titleGlow}>The Leeds Files - Manhunt</Text>
                            <Text style={styles.titleShadow}>The Leeds Files - Manhunt</Text>
                            <Text style={styles.title}>The Leeds Files - Manhunt</Text>
                        </View>

                    </View>

                    {/* Main content */}
                    <View style={styles.middle}>
                        <View style={styles.pinRow}>
                            <Text style={styles.pinLabel}>Pin:</Text>
                            <Text style={styles.pinValue}>{game?.pin}</Text>
                        </View>

                        <View style={styles.players}>
                            <Text style={styles.playersTitle}>Current players:</Text>
                            <View style={styles.playersList}>
                                {players.map((p) => (
                                    <View key={p.name} style={styles.playerItem}>
                                        <View style={[styles.playerDot, { backgroundColor: p.colour }]} />
                                        <Text style={styles.player}>{p.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.controlsRow}>
                            <View style={styles.mapRow}>
                                <Text style={styles.mapLabel}>Map:</Text>
                                {currentPlayer?.isHost ? (
                                    <View style={styles.mapChips}>
                                        {AVAILABLE_MAPS.map((map) => (
                                            <Pressable
                                                key={map.id}
                                                onPress={() => updateMap(map.id)}
                                                style={[styles.mapChip, mapId === map.id && styles.mapChipSelected]}
                                            >
                                                <Text
                                                    numberOfLines={1}
                                                    adjustsFontSizeToFit
                                                    minimumFontScale={0.75}
                                                    style={[styles.mapChipText, mapId === map.id && styles.mapChipTextSelected]}
                                                >
                                                    {map.name}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={styles.mapChips}>
                                        <View style={[styles.mapChip, styles.mapChipSelected]}>
                                            <Text
                                                numberOfLines={1}
                                                adjustsFontSizeToFit
                                                minimumFontScale={0.75}
                                                style={[styles.mapChipText, styles.mapChipTextSelected]}
                                            >
                                                {selectedMapName}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <View style={styles.roundsRow}>
                                <Text style={styles.roundsLabel}>Rounds:</Text>
                                {currentPlayer?.isHost ? (
                                    <View style={styles.roundsChips}>
                                        {ROUND_OPTIONS.map((r) => (
                                            <Pressable
                                                key={r}
                                                onPress={() => updateRounds(r)}
                                                style={[styles.roundsChip, rounds === r && styles.roundsChipSelected]}
                                            >
                                                <Text style={[styles.roundsChipText, rounds === r && styles.roundsChipTextSelected]}>
                                                    {r}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={styles.roundsChips}>
                                        <View style={[styles.roundsChip, styles.roundsChipSelected]}>
                                            <Text style={[styles.roundsChipText, styles.roundsChipTextSelected]}>{rounds}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>

                    </View>

                    {currentPlayer?.isHost && (
                        <View style={styles.footer}>
                            <Pressable onPress={createGame} style={({ pressed }) => [styles.joinButton, pressed && styles.pressedDown]}>
                                <Text style={styles.joinText}>Start Game</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },

    safe: {
        flex: 1,
        backgroundColor: "transparent",
    },

    background: {
        flex: 1,
    },

    layout: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 10,
    },

    /* Background shapes */
    shapes: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.32,
    },

    shape: {
        position: "absolute",
        borderRadius: 9999,
    },

    shapeTopRight: {
        width: 360,
        height: 360,
        right: -130,
        top: -150,
        backgroundColor: "rgba(255,255,255,0.18)",
    },

    shapeLeft: {
        width: 280,
        height: 280,
        left: -150,
        top: 40,
        backgroundColor: "rgba(255,255,255,0.12)",
    },

    shapeBottomRight: {
        width: 440,
        height: 440,
        right: -200,
        bottom: -240,
        backgroundColor: "rgba(0,0,0,0.16)",
    },

    diagonalPlate: {
        position: "absolute",
        left: -140,
        top: 40,
        width: 520,
        height: 260,
        backgroundColor: "rgba(255,255,255,0.08)",
        transform: [{ rotate: "-18deg" }],
        borderRadius: 40,
    },

    /* Title */
    top: {
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 6,
    },

    titleWrap: {
        alignItems: "center",
        justifyContent: "center",
    },

    title: {
        fontFamily: "Pacifico",
        fontSize: 24,
        color: "#ebc3c3",
        letterSpacing: -0.3,
        textShadowColor: "rgba(0,0,0,0.35)",
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 8,
    },

    titleShadow: {
        position: "absolute",
        fontFamily: "Pacifico",
        fontSize: 24,
        color: "rgba(0,0,0,0.35)",
        letterSpacing: -0.3,
        transform: [{ translateY: 4 }],
    },

    titleGlow: {
        position: "absolute",
        fontFamily: "Pacifico",
        fontSize: 24,
        color: "rgba(255,255,255,0.18)",
        letterSpacing: -0.3,
        transform: [{ translateX: -1 }, { translateY: -1 }],
    },

    /* Main content */
    middle: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 4,
    },

    pinRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 12,
        marginTop: 2,
    },

    pinLabel: {
        fontSize: 24,
        color: "rgba(255,255,255,0.92)",
        letterSpacing: 1.4,
        ...Platform.select({
            ios: { fontFamily: "Menlo" },
            android: { fontFamily: "monospace" },
        }),
    },

    pinValue: {
        fontSize: 24,
        color: "rgba(255,255,255,0.92)",
        letterSpacing: 1.4,
        ...Platform.select({
            ios: { fontFamily: "Menlo" },
            android: { fontFamily: "monospace" },
        }),
    },

    players: {
        marginTop: 12,
        alignItems: "center",
    },

    playersTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "rgba(255,255,255,0.88)",
        letterSpacing: 1.4,
        marginBottom: 6,
        ...Platform.select({
            ios: { fontFamily: "Menlo" },
            android: { fontFamily: "monospace" },
        }),
    },

    playersList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
    },

    playerItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    playerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    player: {
        fontSize: 12,
        color: "rgba(255,255,255,0.88)",
        letterSpacing: 0.8,
        ...Platform.select({
            ios: { fontFamily: "Menlo" },
            android: { fontFamily: "monospace" },
        }),
    },

    /* Identical to WelcomeScreen joinButton */
    joinButton: {
        width: "48%",
        minWidth: 160,
        height: 36,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.95)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
    },

    joinText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#000",
    },

    secondaryButton: {
        width: 180,
        height: 36,
        borderRadius: 10,
        backgroundColor: "rgba(235,235,235,0.88)",
        alignItems: "center",
        justifyContent: "center",
    },

    secondaryText: {
        fontSize: 15,
        fontWeight: "800",
        color: "#000",
    },

    bottom: {
        alignItems: "center",
        paddingBottom: 10,
    },

    footer: {
        alignItems: "center",
        justifyContent: "flex-end",
        paddingTop: 8,
        paddingBottom: 2,
    },

    pressedDown: {
        transform: [{ translateY: 1 }],
        opacity: 0.98,
    },

    controlsRow: {
        marginTop: 14,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 14,
        width: "100%",
    },

    roundsRow: {
        marginTop: 0,
        alignItems: "center",
        flexDirection: "column",
        gap: 6,
        flex: 2,
    },

    roundsLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "rgba(255,255,255,0.88)",
        letterSpacing: 1.4,
        marginBottom: 4,
        ...Platform.select({
            ios: { fontFamily: "Menlo" },
            android: { fontFamily: "monospace" },
        }),
    },

    roundsChips: {
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: 5,
        width: "100%",
    },

    roundsChip: {
        flex: 1,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.4)",
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },

    roundsChipSelected: {
        backgroundColor: "rgba(255,255,255,0.92)",
        borderColor: "rgba(255,255,255,0.92)",
    },

    roundsChipText: {
        fontSize: 12,
        fontWeight: "700",
        color: "rgba(255,255,255,0.88)",
    },

    roundsChipTextSelected: {
        color: "#000",
    },

    mapRow: {
        marginTop: 0,
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        flex: 3,
    },

    mapLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "rgba(255,255,255,0.88)",
        letterSpacing: 1.4,
        ...Platform.select({
            ios: { fontFamily: "Menlo" },
            android: { fontFamily: "monospace" },
        }),
    },

    mapChips: {
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: 5,
        width: "100%",
    },

    mapChip: {
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        height: 36,
        paddingHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.4)",
        backgroundColor: "rgba(20,20,20,0.4)",
    },

    mapChipSelected: {
        backgroundColor: "rgba(255,255,255,0.92)",
        borderColor: "rgba(255,255,255,0.92)",
    },

    mapChipText: {
        fontSize: 11,
        fontWeight: "700",
        color: "rgba(255,255,255,0.9)",
        letterSpacing: 0,
        ...Platform.select({
            ios: { fontFamily: "Menlo" },
            android: { fontFamily: "monospace" },
        }),
    },

    mapChipTextSelected: {
        color: "#000",
    },
});
