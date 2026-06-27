import React from "react";
import { MdPerson, MdGroups } from "react-icons/md";
import { Player } from "@packages/types";
import styles from "./PlayerIcon.module.css";

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

    const getBackground = () => {
        if (players.length === 1) {
            return players[0].isLecturer ? "#222" : players[0].colour;
        }

        const colours = players.map((p) => (p.isLecturer ? "#222" : p.colour));
        if (colours.length === 2) {
            return `linear-gradient(45deg, ${colours[0]} 50%, ${colours[1]} 50%)`;
        }
        const step = 100 / colours.length;
        const stops = colours.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(", ");
        return `conic-gradient(${stops})`;
    };

    return (
        <div
            className={`${styles.container} ${hasLecturer ? styles.lecturer : ""}`}
            style={{
                left: x,
                top: y,
                opacity: dim ? 0.3 : 1,
                zIndex: isMultiple ? 60 : 50,
            }}
        >
            <div className={styles.meepleWrapper} style={{ background: getBackground() }}>
                {/* Use a "Groups" icon if more than one person is there */}
                {isMultiple ? <MdGroups className={styles.svg} style={{ color: "white" }} /> : <MdPerson className={styles.svg} style={{ color: players[0].isLecturer ? "#ffd700" : "white" }} />}
            </div>
            <div className={styles.name}>{mergedNames}</div>
        </div>
    );
};
