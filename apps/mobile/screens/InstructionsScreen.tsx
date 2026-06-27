import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAvoidingView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { NavigationProps } from "../App";

// 1. Structure the data to easily map over it
const INSTRUCTIONS_DATA = [
    {
        title: "Roles",
        points: ["Lecturer moves secretly around the city.", "Students work together to track him down."],
    },
    {
        title: "Goal",
        points: ["Students win if any student lands on the Lecturer’s location.", "Lecturer wins if he avoids capture until the end of the game or Students can’t move."],
    },
    {
        title: "Movement",
        points: ["Students move using Bicycle, Taxi and Bus tickets.", "Lecturer’s position is hidden. Only the ticket type is shown.", "At certain turns, the Lecturer must reveal his location."],
    },
    {
        title: "Turns",
        points: ["The Lecturer moves first, then all students move.", "Students cannot move onto the same space as each other.", "Used tickets go to the Lecturer."],
    },
    {
        title: "Strategy",
        points: ["Students deduce the Lecturer’s location from ticket history and block escape routes.", "The Lecturer misleads and escapes using smart routes and special tickets."],
    },
];

export default function InstructionsScreen({ navigation }: NavigationProps) {
    const [fontsLoaded] = useFonts({
        Pacifico: Pacifico_400Regular,
    });

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

                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.titleWrap}>
                            <Text style={styles.titleGlow}>Instructions</Text>
                            <Text style={styles.titleShadow}>Instructions</Text>
                            <Text style={styles.title}>Instructions</Text>
                        </View>

                        <Text style={styles.paragraph}>Leeds Files – Manhunt is a detective game where one player is the fleeing Lecturer and the others are Students attempting to find them.</Text>

                        {/* 2. Map over the data array to render the UI */}
                        {INSTRUCTIONS_DATA.map((section, index) => (
                            <View key={index}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                {section.points.map((point, pointIdx) => (
                                    <Text key={pointIdx} style={styles.paragraph}>
                                        • {point}
                                    </Text>
                                ))}
                            </View>
                        ))}

                        {/* Main Menu Button */}
                        <View style={styles.buttonContainer}>
                            <Pressable style={({ pressed }) => [styles.mainButton, pressed && styles.pressedDown]} onPress={() => navigation.navigate("Welcome")}>
                                <Text style={styles.mainButtonText}>Main Menu</Text>
                            </Pressable>
                        </View>
                    </ScrollView>
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

    content: {
        // 3. FIXED: Changed 'flex: 1' to 'flexGrow: 1' so scrolling works!
        flexGrow: 1,
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 20,
        alignItems: "stretch",
        justifyContent: "flex-start",
    },

    /* Title styling to match WelcomeScreen */
    titleWrap: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },

    title: {
        fontFamily: "Pacifico",
        fontSize: 28,
        color: "#ebc3c3",
        letterSpacing: -0.4,
        textShadowColor: "rgba(0,0,0,0.35)",
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 8,
    },

    titleShadow: {
        position: "absolute",
        fontFamily: "Pacifico",
        fontSize: 28,
        color: "rgba(0,0,0,0.35)",
        letterSpacing: -0.4,
        transform: [{ translateY: 5 }],
    },

    titleGlow: {
        position: "absolute",
        fontFamily: "Pacifico",
        fontSize: 28,
        color: "rgba(255,255,255,0.18)",
        letterSpacing: -0.4,
        transform: [{ translateX: -1 }, { translateY: -1 }],
    },

    sectionTitle: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 14,
        marginBottom: 4,
        textAlign: "left",
    },

    paragraph: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 15,
        textAlign: "left",
        marginBottom: 4,
    },

    /* Main Menu Button */
    buttonContainer: {
        marginTop: 22,
        marginBottom: 20,
        width: "100%",
        alignItems: "center",
    },

    mainButton: {
        width: 200,
        height: 40,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.95)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
    },

    mainButtonText: {
        fontSize: 16,
        fontWeight: "800",
        color: "#000",
    },

    pressedDown: {
        transform: [{ translateY: 1 }],
        opacity: 0.98,
    },

    /* Background shapes (copied from WelcomeScreen) */
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
    },
});
