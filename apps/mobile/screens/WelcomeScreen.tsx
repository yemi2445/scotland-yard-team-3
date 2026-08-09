import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { formatGamePin, isValidGamePin } from "@packages/utils";
import { apiClient } from "@packages/api";
import type { NavigationProps } from "../App";
import { useGameState } from "@packages/providers";

export default function WelcomeScreen({ navigation }: NavigationProps) {
    const { setPlayerId, setGame } = useGameState();

    const [pin, setPin] = useState("");
    const [name, setName] = useState("");
    const [mode, setMode] = useState<"create" | "join">("create");

    const [fontsLoaded] = useFonts({
        Pacifico: Pacifico_400Regular,
    });

    const canJoin = useMemo(() => isValidGamePin(pin) && name.trim().length > 0, [pin, name]);

    const handlePlay = async () => {
        try {
            const gamePin = formatGamePin(pin).replace("-", "");

            // Step 1: join the game
            const joinResponse: any = await apiClient.joinGame(gamePin, name);
            if (!joinResponse.playerId) {
                alert("Failed to join game — no player ID returned.");
                return;
            }
            const playerId= String(joinResponse.playerId);

            // Step 2: Fetch full game state
            const rawGame: any = await apiClient.getGame(gamePin);
            const mapData: any = await apiClient.getMap(rawGame.mapId);
            const mapName: any = mapData?.mapName ?? "Mini Map";

            const game: any = {
                pin: String(rawGame.gameId),
                mapId: rawGame.mapId,
                mapName: mapName,
                status: rawGame.state === "Open" ? "waiting" :
                    rawGame.state === "Fugitive" || rawGame.state === "Detective" ? "active" : "finished",
                currentTurn: null,
                currentRound: rawGame.round ?? 0,
                totalRounds: rawGame.length ?? 0,
                winMessage: rawGame.winner !== "None" ? `${rawGame.winner} Wins!` : null,
                travelLog: [],
                players: (rawGame.players ?? []).map((p: any, i: number) => {
                    // The server masks our own (fugitive) location outside reveal rounds, even
                    // right after we've just joined. startLocation from the join response is the
                    // only place our true starting position is ever exposed.
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
                        tickets: {
                            yellow: typeof p.yellow === "number" ? p.yellow : 0,
                            green: typeof p.green === "number" ? p.green : 0,
                            red: typeof p.red === "number" ? p.red : 0,
                            black: typeof p.black === "number" ? p.black : 0,
                            x2: typeof p["2x"] === "number" ? p["2x"] : 0,
                        },
                        isSpectator: false,
                    };
                }),
            };

            setPlayerId(playerId);
            setGame(game);

            if (game.status === "active") {
                navigation.navigate("Play");
            } else {
                navigation.navigate("CreateGame")
            }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        alert(`Failed to join game: Reason: ${message}`);
    }
};


   const handleCreateGame = async () => {
    try {
        if (name.trim().length === 0) {
            alert("Please enter your name before creating a game.");
            return;
        }

        const createResponse: any = await apiClient.createGame(name, 567, "short");
        const gameId = createResponse.gameId;

        const joinResponse: any = await apiClient.joinGame(gameId, name);
        const playerId = String(joinResponse.playerId);

        const rawGame: any = await apiClient.getGame(gameId);
        const mapData: any = await apiClient.getMap(rawGame.mapId);
        const mapName = mapData?.mapName ?? "Mini Map";

         const game: any = {
            pin: String(rawGame.gameId),
            mapId: rawGame.mapId,
            mapName: mapName,
            status: rawGame.state === "Open" ? "waiting" :
                rawGame.state === "Fugitive" || rawGame.state === "Detective" ? "active" : "finished",
            currentTurn: rawGame.currentTurn ?? null,
            currentRound: rawGame.round ?? 0,
            totalRounds: rawGame.length ?? 0,
            winMessage: rawGame.winner !== "None" ? `${rawGame.winner} Wins!` : null,
            travelLog: [],
            players: (rawGame.players ?? []).map((p: any, i: number) => {
                // The server masks the fugitive's own location outside reveal rounds, even
                // right after joining. startLocation from the join response is the only
                // place our true starting position is ever exposed.
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
                    tickets: {
                        yellow: typeof p.yellow === "number" ? p.yellow : 0,
                        green: typeof p.green === "number" ? p.green : 0,
                        red: typeof p.red === "number" ? p.red : 0,
                        black: typeof p.black === "number" ? p.black : 0,
                        x2: typeof p["2x"] === "number" ? p["2x"] : 0,
                    },
                    isSpectator: false,
                };
            }),
        };
        setPlayerId(playerId);
        setGame(game);
        navigation.navigate("CreateGame");
    } catch (e) {
        console.log(e);
        alert("Failed to create game. Please try again.");
    }
         
        
};

    const onJoin = () => {
        if (!canJoin) return;
        handlePlay();
    };

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
                        <View style={styles.top}>
                            <View style={styles.titleWrap}>
                                <Text style={styles.titleGlow}>The Leeds Files - Manhunt</Text>
                                <Text style={styles.titleShadow}>The Leeds Files - Manhunt</Text>
                                <Text style={styles.title}>The Leeds Files - Manhunt</Text>
                            </View>
                        </View>

                        <View style={styles.middle}>
                            <View style={styles.form}>
                                <Text style={styles.label}>Enter your name:</Text>
                                <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Enter name" placeholderTextColor="rgba(255,255,255,0.35)" />

                                {mode === "join" && (
                                    <>
                                        <Text style={[styles.label, styles.labelSpacing]}>Enter game pin:</Text>
                                        <TextInput value={pin} onChangeText={(text) => setPin(formatGamePin(text))} style={styles.input} keyboardType="number-pad" placeholder="000-000" placeholderTextColor="rgba(255,255,255,0.35)" maxLength={7} />
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Bottom row: Instructions | Join Game / Back | Create Game / Confirm Join */}
                        <View style={styles.bottom}>
                            {mode === "create" ? (
                                <>
                                    <Pressable style={({ pressed }) => [styles.bottomButton, styles.secondary, pressed && styles.pressedDown]} onPress={() => navigation.navigate("Instructions")}>
                                        <Text style={styles.bottomText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Instructions</Text>
                                    </Pressable>

                                    <Pressable style={({ pressed }) => [styles.bottomButton, styles.primary, pressed && styles.pressedDown]} onPress={() => setMode("join")}>
                                        <Text style={styles.bottomText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Join Game</Text>
                                    </Pressable>

                                    <Pressable style={({ pressed }) => [styles.bottomButton, styles.primary, pressed && styles.pressedDown]} onPress={handleCreateGame}>
                                        <Text style={styles.bottomText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Create Game</Text>
                                    </Pressable>
                                </>
                            ) : (
                                <>
                                    <Pressable style={({ pressed }) => [styles.bottomButton, styles.secondary, pressed && styles.pressedDown]} onPress={() => setMode("create")}>
                                        <Text style={styles.bottomText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Back</Text>
                                    </Pressable>

                                    <Pressable onPress={onJoin} disabled={!canJoin} style={({ pressed }) => [styles.bottomButton, styles.primary, !canJoin && styles.joinDisabled, pressed && canJoin && styles.pressedDown]}>
                                        <Text style={styles.bottomText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Confirm Join</Text>
                                    </Pressable>
                                </>
                            )}
                        </View>
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
        paddingHorizontal: 22,
        paddingTop: 10,
        paddingBottom: 12,
    },

    top: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 2,
        paddingBottom: 6,
    },

    middle: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    bottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingBottom: 10,
        paddingHorizontal: 10,
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

    titleWrap: {
        alignItems: "center",
        justifyContent: "center",
    },

    title: {
        fontFamily: "Pacifico",
        fontSize: 30,
        color: "#ebc3c3",
        letterSpacing: -0.4,
        textShadowColor: "rgba(0,0,0,0.35)",
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 8,
    },

    titleShadow: {
        position: "absolute",
        fontFamily: "Pacifico",
        fontSize: 30,
        color: "rgba(0,0,0,0.35)",
        letterSpacing: -0.4,
        transform: [{ translateY: 5 }],
    },

    titleGlow: {
        position: "absolute",
        fontFamily: "Pacifico",
        fontSize: 30,
        color: "rgba(255,255,255,0.18)",
        letterSpacing: -0.4,
        transform: [{ translateX: -1 }, { translateY: -1 }],
    },

    form: {
        width: "58%",
        maxWidth: 360,
        alignItems: "center",
    },

    label: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 13,
        letterSpacing: 1.1,
        marginBottom: 6,
    },

    labelSpacing: {
        marginTop: 12,
    },

    input: {
        width: "100%",
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.28)",
        backgroundColor: "rgba(0,0,0,0.18)",
        color: "#fff",
        textAlign: "center",
        fontSize: 16,
        paddingVertical: 8,
    },

    joinDisabled: {
        opacity: 0.45,
    },

    bottomButton: {
        flex: 1,
        minWidth: 0,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
    },

    secondary: {
        backgroundColor: "rgba(235,235,235,0.88)",
    },

    primary: {
        backgroundColor: "rgba(255,255,255,0.95)",
    },

    bottomText: {
        fontSize: 15,
        fontWeight: "800",
        color: "#000",
    },

    pressedDown: {
        transform: [{ translateY: 1 }],
        opacity: 0.98,
    },

});
