import React from "react";
import styles from "./TransportBar.module.css";
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
        const classes = [
            styles.ticket,
            styles[type] ?? "",
            isMyTurn ? styles.interactive : "",
            isDisabled ? styles.disabled : "",
            isSelected ? styles.selected : "",
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <button
                key={type}
                className={classes}
                disabled={!isMyTurn || isDisabled}
                onClick={() => {
                    if (!isMyTurn || isDisabled) return;
                    onTransportSelect?.(transport);
                }}
                title={
                    isDisabled
                        ? `No ${type} tickets left`
                        : isSelected
                        ? `Deselect ${type}`
                        : `Use ${type}`
                }
            >
                <TransportIcon type={type} className={styles.icon} colour={isDisabled ? "#555" : colour} />
                <span className={styles.ticketCount} style={{ color: isDisabled ? "#555" : colour }}>
                    {count}
                </span>
            </button>
        );
    };

    return (
        <div className={styles.barContainer}>
            {normalEntries.map(renderEntry)}
            {player.isLecturer && secondaryEntries.length > 0 && <div className={styles.divider} />}
            {player.isLecturer && secondaryEntries.map(renderEntry)}
        </div>
    );
};
