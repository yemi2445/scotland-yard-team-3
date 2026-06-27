import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface TurnIndicatorProps {
    currentPlayerName: string;
    round: number;
    gameOver: boolean;
    winMessage: string | undefined;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({ currentPlayerName, round, gameOver, winMessage }) => {
    const titleText = gameOver ? "Game Over" : `Round ${round}`;
    const detailText = gameOver ? (winMessage ?? "The game has ended.") : `${currentPlayerName} Turn`;

    return (
        <View style={[styles.indicator, gameOver && styles.indicatorGameOver]}>
            <Text style={styles.label}>{titleText}</Text>
            <Text style={[styles.name, gameOver && styles.nameGameOver]}>{detailText}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    indicator: {
        position: "absolute",
        top: 20,
        right: 20,
        maxWidth: "56%",
        backgroundColor: "rgba(20,20,20,0.9)",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
        flexDirection: "column",
        alignItems: "flex-start",

        gap: 4,

        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 4 },

        elevation: 6,
        zIndex: 1000,
    },

    indicatorGameOver: {
        top: 92,
        right: 12,
    },

    label: {
        color: "#ccc",
        fontSize: 14,
        textTransform: "uppercase",
        fontWeight: "600",
    },

    name: {
        fontSize: 18,
        color: "#fff",
        fontWeight: "bold",
    },

    nameGameOver: {
        fontSize: 14,
        lineHeight: 18,
        flexShrink: 1,
    },
});
