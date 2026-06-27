import React from "react";
import styles from "./PositionNode.module.css";
import { TransportType } from "@packages/types";
import { TRANSPORT_COLOURS } from "@packages/utils";

export type NodeHighlight = "selected" | "inspected" | "pending" | "hovered" | "none";

interface PositionNodeProps {
    // Node label displayed inside the circle
    label: React.ReactNode;
    // Transport types connected to this node — drives the colour segments
    transports: TransportType[];
    // X position value
    x: number;
    // Y position value
    y: number;
    // Visual highlight state
    highlight?: NodeHighlight;
    onClick?: (e: React.MouseEvent) => void;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    // Override diameter in pixels (default 24)
    size?: number;
}

// Logic to determine node background based on transports
export function getNodeBackground(transports: TransportType[]): string {
    const unique = Array.from(new Set(transports));
    const colours = unique.map((t) => TRANSPORT_COLOURS[t]).filter(Boolean);

    if (colours.length === 0) return "white";
    if (colours.length === 1) return colours[0];
    if (colours.length === 2) return `conic-gradient(${colours[0]} 0% 50%, ${colours[1]} 50% 100%)`;
    return `conic-gradient(${colours[0]} 0% 33%, ${colours[1]} 33% 66%, ${colours[2]} 66% 100%)`;
}

export const PositionNode: React.FC<PositionNodeProps> = ({ label, transports, x, y, highlight = "none", onClick, onMouseEnter, onMouseLeave, size = 24 }) => {
    const background = getNodeBackground(transports);

    return (
        <div
            className={`${styles.node} ${styles[highlight] ?? ""}`}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                background,
                fontSize: Math.max(8, size * 0.42),
            }}
        >
            {label}
        </div>
    );
};
