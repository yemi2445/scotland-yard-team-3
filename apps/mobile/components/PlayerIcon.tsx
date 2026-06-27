import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { Player } from "@packages/types";

interface PlayerIconProps {
    players: Player[];
    x: number;
    y: number;
    dim?: boolean;
}

export const PlayerIcon: React.FC<PlayerIconProps> = ({ players, x, y, dim }) => {
    if (players.length === 0) return null;

    const isMultiple = players.length > 1;
    const hasLecturer = players.some((p) => p.isLecturer);
    const mergedNames = players.map((p) => p.name).join(", ");

    const getSegmentColours = (): string[] => {
        const colours = players.map((p) => (p.isLecturer ? "#222" : p.colour));
        if (colours.length === 0) return ["white"];
        if (colours.length === 1) return [colours[0]];
        if (colours.length === 2) return colours;
        return colours.slice(0, 3);
    };

    const meepleSize = 24;
    const borderColour = hasLecturer ? "#ffd700" : "white";
    const shadowColour = hasLecturer ? "rgba(255,215,0,0.4)" : "rgba(0,0,0,0.3)";
    const segmentColours = getSegmentColours();

    const makeSectorPath = (startAngle: number, endAngle: number) => {
        const r = meepleSize;
        const cx = meepleSize / 2;
        const cy = meepleSize / 2;

        const pad = 0.5;
        const startRad = (Math.PI / 180) * (startAngle - pad);
        const endRad = (Math.PI / 180) * (endAngle + pad);

        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    const singleColour = segmentColours.length === 1;
    const iconSize = isMultiple ? meepleSize * 0.6 : 16;

    const offsetX = -meepleSize / 2;
    const offsetY = -meepleSize * 1.5;

    return (
        <View
            style={[
                styles.container,
                {
                    left: x,
                    top: y,
                    opacity: dim ? 0.3 : 1,
                    zIndex: isMultiple ? 60 : 50,
                    transform: [{ translateX: offsetX }, { translateY: offsetY }],
                },
            ]}
            pointerEvents="none"
        >
            <View
                style={[
                    styles.meepleWrapper,
                    {
                        width: meepleSize,
                        height: meepleSize,
                        borderRadius: meepleSize / 2,
                        borderColor: borderColour,
                        shadowColor: shadowColour,
                        ...(singleColour ? { backgroundColor: segmentColours[0] } : {}),
                    },
                ]}
            >
                {!singleColour && (
                    <Svg width={meepleSize} height={meepleSize} style={StyleSheet.absoluteFill}>
                        {segmentColours.map((c, i) => {
                            const segmentAngle = 360 / segmentColours.length;
                            const start = i * segmentAngle - 90;
                            const end = start + segmentAngle;
                            return <Path key={i} d={makeSectorPath(start, end)} fill={c} />;
                        })}
                    </Svg>
                )}
                <MaterialIcons name={isMultiple ? "groups" : "person"} size={iconSize} color={hasLecturer && !isMultiple ? "#ffd700" : "white"} />
            </View>
            <View style={styles.namePill}>
                <Text style={styles.nameText} numberOfLines={1}>
                    {mergedNames}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        alignItems: "center",
    },
    meepleWrapper: {
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
        overflow: "hidden",
    },
    namePill: {
        backgroundColor: "rgba(20,20,20,0.85)",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 4,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        maxWidth: 150,
    },
    nameText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#fff",
        textAlign: "center",
    },
});
