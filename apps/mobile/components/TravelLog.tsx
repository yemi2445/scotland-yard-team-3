import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TravelLogEntry } from "@packages/types";
import { LECTURER_MUST_REVEAL_TURNS, TRANSPORT_COLOURS } from "@packages/utils";
import { TransportIcon } from "./TransportIcons";

interface TravelLogProps {
    logs: TravelLogEntry[];
    isLecturer: boolean;
    gameOver: boolean;
    totalRounds: number;
}

export const TravelLog: React.FC<TravelLogProps> = ({ logs, isLecturer, gameOver, totalRounds }) => {
    const slots = Array.from({ length: totalRounds }, (_, i) => i + 1);

    const columnCount = 3;
    const rowsPerColumn = Math.ceil(slots.length / columnCount);

    const columns = Array.from({ length: columnCount }, (_, colIndex) => slots.slice(colIndex * rowsPerColumn, (colIndex + 1) * rowsPerColumn));

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isLecturer ? "Lecturer's Travel Log (You)" : "Lecturer's Travel Log"}</Text>

            <View style={styles.grid}>
                {columns.map((column, colIndex) => (
                    <View key={colIndex} style={styles.column}>
                        {column.map((turn) => {
                            const entry = logs.find((l) => l.turn === turn);
                            const isRevealTurn = LECTURER_MUST_REVEAL_TURNS.includes(turn);
                            const shouldRevealPosition = gameOver || isRevealTurn;
                            const handleHiddenTransport = entry && !entry.isTransportHidden ? entry.transport : "black";

                            return (
                                <View key={turn} style={styles.logEntry}>
                                    <View style={[styles.turnNumber, isRevealTurn && styles.revealTurn]}>
                                        <Text style={[styles.turnText, isRevealTurn && styles.revealTurnText]}>{turn}</Text>
                                    </View>

                                    <View style={styles.transport}>{entry ? <TransportIcon type={handleHiddenTransport} colour={TRANSPORT_COLOURS[handleHiddenTransport]} /> : <Text style={styles.placeholder}>---</Text>}</View>

                                    {shouldRevealPosition && entry && entry.position && <Text style={styles.position}>{entry.position}</Text>}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 8,
        left: 8,
        backgroundColor: "rgba(0,0,0,0.85)",
        paddingVertical: 6,
        paddingHorizontal: 6,
        borderRadius: 5,
        zIndex: 1000,
    },

    title: {
        fontSize: 11,
        fontWeight: "bold",
        marginBottom: 4,
        textAlign: "center",
        borderBottomWidth: 0.5,
        borderBottomColor: "rgba(255,255,255,0.2)",
        paddingBottom: 3,
        color: "white",
        fontFamily: "monospace",
    },

    grid: {
        flexDirection: "row",
    },

    column: {
        marginRight: 8,
    },

    logEntry: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 2,
        width: 58,
    },

    turnNumber: {
        width: 14,
        height: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 3,
    },

    turnText: {
        color: "#aaa",
        fontSize: 9,
    },

    revealTurn: {
        borderWidth: 1,
        borderColor: "#ff0055",
        borderRadius: 7,
    },

    revealTurnText: {
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: 9,
    },

    transport: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    placeholder: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 9,
    },

    position: {
        width: 20,
        textAlign: "right",
        color: "#ffd700",
        fontWeight: "bold",
        fontSize: 9,
    },
});
