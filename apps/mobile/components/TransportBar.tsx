import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Player, TransportType } from "@packages/types";
import { sortTransports, TRANSPORT_COLOURS, SECONDARY_TRANSPORTS } from "@packages/utils";
import { TransportIcon } from "./TransportIcons";

interface TransportBarProps {
    player: Player;
    selectedTransport?: TransportType | null;
    selectedSecondaryTransport?: TransportType | null;
    onTransportSelect?: (t: TransportType) => void;
    isMyTurn?: boolean;
}

export const TransportBar: React.FC<TransportBarProps> = ({ player, selectedTransport, selectedSecondaryTransport, onTransportSelect, isMyTurn = false }) => {
    const entries = Object.entries(player.tickets).sort(sortTransports);
    const normalEntries = entries.filter(([type]) => !SECONDARY_TRANSPORTS.includes(type));
    const secondaryEntries = entries.filter(([type]) => SECONDARY_TRANSPORTS.includes(type));

    const renderEntry = ([type, count]: [string, number]) => {
        const transport = type as TransportType;
        const isDisabled = count === 0;
        const isSelected = selectedTransport === transport || selectedSecondaryTransport === transport;
        const colour = TRANSPORT_COLOURS[transport] ?? "#ffffff";

        const inner = (
            <>
                <TransportIcon type={type} size={isSelected ? 34 : 26} colour={isDisabled ? "#555" : colour} />
                <Text
                    style={[
                        styles.ticketCount,
                        { color: isDisabled ? "#555" : colour },
                    ]}
                >
                    {count}
                </Text>
            </>
        );

        if (!isMyTurn || isDisabled) {
            return (
                <View
                    key={type}
                    style={[
                        styles.ticket,
                        isSelected && { ...styles.ticketSelected, borderColor: colour },
                        isDisabled && styles.ticketDisabled,
                    ]}
                >
                    {inner}
                </View>
            );
        }

        return (
            <TouchableOpacity
                key={type}
                activeOpacity={0.7}
                style={[
                    styles.ticket,
                    styles.ticketInteractive,
                    isSelected && {
                        ...styles.ticketSelected,
                        borderColor: colour,
                        shadowColor: colour,
                    },
                ]}
                onPress={() => onTransportSelect?.(transport)}
            >
                {inner}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.barContainer}>
            {normalEntries.map(renderEntry)}
            {player.isLecturer && secondaryEntries.length > 0 && <View style={styles.divider} />}
            {player.isLecturer && secondaryEntries.map(renderEntry)}
        </View>
    );
};

const styles = StyleSheet.create({
    barContainer: {
        position: "absolute",
        bottom: 20,
        alignSelf: "center",
        backgroundColor: "rgba(20,20,20,0.9)",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        flexDirection: "row",
        gap: 8,
        zIndex: 1000,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    ticket: {
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "transparent",
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 54,
    },
    ticketInteractive: {},
    ticketSelected: {
        borderWidth: 2,
        backgroundColor: "rgba(255,255,255,0.12)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 8,
        transform: [{ scale: 1.15 }],
    },
    ticketDisabled: {
        opacity: 0.3,
    },
    ticketCount: {
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: "monospace",
        marginTop: 3,
    },
    divider: {
        width: 1,
        backgroundColor: "rgba(255,255,255,0.3)",
        marginHorizontal: 6,
        alignSelf: "stretch",
    },
});