import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { ALLOWED_PLAYER_COLOURS, formatGamePin, getColourHex, isValidGamePin, PLAYER_COLOURS, PlayerColour } from "@packages/utils";
import { apiClient } from "@packages/api";
import type { NavigationProps } from "../App";
import { useGameState } from "@packages/providers";

export default function WelcomeScreen({ navigation }: NavigationProps) {
    const { setPlayerId, setGame } = useGameState();

    const [pin, setPin] = useState("");
    const [name, setName] = useState("");
    const [colour, setColour] = useState<PlayerColour>(ALLOWED_PLAYER_COLOURS[Math.floor(Math.random() * ALLOWED_PLAYER_COLOURS.length)]);
    const [colourOpen, setColourOpen] = useState(false);

    const [fontsLoaded] = useFonts({
        Pacifico: Pacifico_400Regular,
    });

    const canJoin = useMemo(() => isValidGamePin(pin) && name.trim().length > 0, [pin, name, colour]);

    const handlePlay = async () => {
        try {
            const gamePin = formatGamePin(pin);

            // Static v1: colour is selected locally (not sent yet)
            const response = await apiClient.joinGame(gamePin, name );
            if (!response.playerId) {
                alert("Failed to join game — no player ID returned.");
                return;
            }

            console.log("Joined game:", response.game);
            console.log("Selected colour:", colour);

            setGame(response.game);
            setPlayerId(response.playerId);

            if (response.game.status === "active") {
                navigation.navigate("Play");
            } else {
                navigation.navigate("CreateGame");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const lower = message.toLowerCase();

            if (lower.includes("colour") && (lower.includes("taken"))) {
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

    const handleCreateGame = async () => {
        try {
            if (name.trim().length === 0) {
                alert("Please enter your name before creating a game.");
                return;
            }

            // Static v1: colour is selected locally (not sent yet)
            const { game, playerId } = await apiClient.createGame(name, 1, "short");

            console.log("Created game:", game);
            console.log("Selected colour:", colour);

            setPlayerId(playerId);
            setGame(game);
            navigation.navigate("CreateGame");
        } catch (e) {
            console.log(e);
            alert("Error connecting to backend");
        }
    };

    const onJoin = () => {
        if (!canJoin) return;
        handlePlay();
    };

    if (!fontsLoaded) return null;

    const selectedHex = getColourHex(colour);

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
                                <Text style={styles.label}>Enter game pin:</Text>
                                <TextInput value={pin} onChangeText={(text) => setPin(formatGamePin(text))} style={styles.input} keyboardType="number-pad" placeholder="000-000" placeholderTextColor="rgba(255,255,255,0.35)" maxLength={7} />

                                <Text style={[styles.label, styles.labelSpacing]}>Enter your name:</Text>
                                <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Enter name" placeholderTextColor="rgba(255,255,255,0.35)" />

                                {/* Colour dropdown chip (centered) */}
                                <Pressable onPress={() => setColourOpen(true)} accessibilityRole="button" accessibilityLabel="Select colour" style={({ pressed }) => [styles.colourChipCenter, pressed && styles.pressedDown]}>
                                    <View style={[styles.colourSwatch, { backgroundColor: selectedHex }]} />
                                    <Text style={styles.colourChipText}>Colour</Text>
                                    <Text style={styles.colourChevron}>▾</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Bottom row: Instructions | Join Game | Create Game */}
                        <View style={styles.bottom}>
                            <Pressable style={({ pressed }) => [styles.bottomButton, styles.secondary, pressed && styles.pressedDown]} onPress={() => navigation.navigate("Instructions")}>
                                <Text style={styles.bottomText}>Instructions</Text>
                            </Pressable>

                            <Pressable onPress={onJoin} disabled={!canJoin} style={({ pressed }) => [styles.bottomButton, styles.primary, !canJoin && styles.joinDisabled, pressed && canJoin && styles.pressedDown]}>
                                <Text style={styles.bottomText}>Join Game</Text>
                            </Pressable>

                            <Pressable style={({ pressed }) => [styles.bottomButton, styles.primary, pressed && styles.pressedDown]} onPress={handleCreateGame}>
                                <Text style={styles.bottomText}>Create Game</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* In-screen overlay popup (NOT Modal) */}
                    {colourOpen && (
                        <View style={styles.overlayRoot}>
                            <Pressable style={styles.overlayBackdrop} onPress={() => setColourOpen(false)} />

                            <View style={styles.overlayPanel}>
                                <Text style={styles.modalTitle}>Choose a colour</Text>

                                <View style={styles.colourGrid}>
                                    {PLAYER_COLOURS.map((c) => {
                                        const isSelected = c.key === colour;

                                        return (
                                            <Pressable
                                                key={c.key}
                                                onPress={() => {
                                                    setColour(c.key);
                                                    setColourOpen(false);
                                                }}
                                                style={[styles.colourOptionWrap, isSelected && styles.colourOptionSelected]}
                                            >
                                                <View
                                                    style={[
                                                        styles.colourOption,
                                                        {
                                                            backgroundColor: c.hex,
                                                        },
                                                    ]}
                                                />
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                <Pressable onPress={() => setColourOpen(false)} style={styles.modalCloseButton}>
                                    <Text style={styles.modalCloseText}>Close</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}
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
        justifyContent: "space-between",
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

    colourChipCenter: {
        marginTop: 14,
        width: "52%",
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.28)",
        backgroundColor: "rgba(0,0,0,0.18)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    colourSwatch: {
        width: 14,
        height: 14,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.35)",
        marginRight: 8,
    },

    colourChipText: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 13,
        letterSpacing: 0.6,
    },

    colourChevron: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 12,
        marginLeft: 8,
    },

    joinDisabled: {
        opacity: 0.45,
    },

    bottomButton: {
        width: 120,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
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

    /* Overlay popup (non-Modal) */
    overlayRoot: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 50,
    },

    overlayBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.45)",
    },

    overlayPanel: {
        position: "absolute",
        width: "80%",
        maxWidth: 320,
        alignSelf: "center",
        top: "42%",

        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 12,

        backgroundColor: "rgba(30,30,30,0.95)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",

        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
        ...(Platform.OS === "android" ? { elevation: 6 } : {}),
    },

    modalTitle: {
        color: "rgba(255,255,255,0.92)",
        fontSize: 14,
        letterSpacing: 1.1,
        marginBottom: 12,
        textAlign: "center",
        fontWeight: "700",
    },

    colourGrid: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        marginBottom: 10,
    },

    colourOptionWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.22)",
        backgroundColor: "rgba(0,0,0,0.15)",
        alignItems: "center",
        justifyContent: "center",
        margin: 4,
    },

    colourOptionSelected: {
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.95)",
    },

    colourOption: {
        width: 24,
        height: 24,
        borderRadius: 7,
    },

    modalCloseButton: {
        height: 36,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.92)",
        alignItems: "center",
        justifyContent: "center",
    },

    modalCloseText: {
        fontSize: 15,
        fontWeight: "800",
        color: "#000",
    },
});
