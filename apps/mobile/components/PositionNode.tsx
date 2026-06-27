import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { TransportType } from "@packages/types";
import { TRANSPORT_COLOURS } from "@packages/utils";

export type NodeHighlight = "selected" | "inspected" | "pending" | "hovered" | "none";

interface PositionNodeProps {
    label: React.ReactNode;
    transports: TransportType[];
    x: number;
    y: number;
    highlight?: NodeHighlight;
    onPress?: () => void;
    onConfirm?: () => void;
    size?: number;
}

export function getNodeBackground(transports: TransportType[]): string[] {
    const unique = Array.from(new Set(transports));
    const colours = unique.map((t) => TRANSPORT_COLOURS[t]).filter(Boolean);
    if (colours.length === 0) return ["white", "white"];
    if (colours.length === 1) return [colours[0], colours[0]];
    return colours;
}

export const PositionNode: React.FC<PositionNodeProps> = ({ label, transports, x, y, highlight = "none", onPress, size = 24 }) => {
    const colours = getNodeBackground(transports);
    const isHighlighted = highlight === "hovered" || highlight === "selected" || highlight === "pending";
    const isPending = highlight === "pending";

    const borderColour = highlight === "selected" ? "#ff4757" : highlight === "inspected" ? "#1e90ff" : highlight === "hovered" ? "#00aaff" : highlight === "pending" ? "#ffa502" : "rgba(255,255,255,0.8)";

    const nodeSize = isHighlighted ? size * 1.3 : size;
    const fontSize = Math.max(8, nodeSize * 0.42);

    const makeSectorPath = (startAngle: number, endAngle: number) => {
        const r = nodeSize;
        const cx = nodeSize / 2;
        const cy = nodeSize / 2;

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

    const renderBackground = () => {
        if (colours.length === 1) {
            return (
                <View
                    style={[
                        styles.nodeInner,
                        {
                            width: nodeSize,
                            height: nodeSize,
                            borderRadius: nodeSize / 2,
                            backgroundColor: colours[0],
                            borderWidth: highlight === "selected" || highlight === "inspected" ? 3 : 2,
                            borderColor: borderColour,
                        },
                    ]}
                >
                    <Text style={[styles.label, { fontSize }]}>{label}</Text>
                </View>
            );
        }

        const segmentAngle = 360 / colours.length;
        return (
            <View
                style={[
                    styles.nodeInner,
                    {
                        width: nodeSize,
                        height: nodeSize,
                        borderRadius: nodeSize / 2,
                        borderWidth: highlight === "selected" || highlight === "inspected" ? 3 : 2,
                        borderColor: borderColour,
                        overflow: "hidden",
                    },
                ]}
            >
                <Svg width={nodeSize} height={nodeSize} style={StyleSheet.absoluteFill}>
                    {colours.map((c, i) => {
                        const start = i * segmentAngle - 90;
                        const end = start + segmentAngle;
                        return <Path key={i} d={makeSectorPath(start, end)} fill={c} />;
                    })}
                </Svg>
                <Text style={[styles.label, styles.labelAbsolute, { fontSize }]}>{label}</Text>
            </View>
        );
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[
                styles.container,
                {
                    left: `${x}%` as any,
                    top: `${y}%` as any,
                    width: nodeSize,
                    height: nodeSize,
                    marginLeft: -nodeSize / 2,
                    marginTop: -nodeSize / 2,
                    zIndex: isHighlighted ? 30 : isPending ? 20 : 10,
                },
            ]}
        >
            {renderBackground()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    nodeInner: {
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    label: {
        color: "#fff",
        fontWeight: "700",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    labelAbsolute: {
        position: "absolute",
    },
});
