import React from "react";
import styles from "./TravelLog.module.css";
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

    return (
        <div className={styles.container}>
            <div className={styles.title}>{isLecturer ? "Lecturer's Travel Log (You)" : "Lecturer's Travel Log"}</div>

            <div
                className={styles.grid}
                style={{ gridTemplateRows: `repeat(${Math.ceil(totalRounds / 3)}, auto)` }}
            >
                {slots.map((turn) => {
                    const entry = logs.find((l) => l.turn === turn);
                    const isRevealTurn = LECTURER_MUST_REVEAL_TURNS.includes(turn);
                    const shouldRevealPosition = gameOver || isRevealTurn;
                    const handleHiddenTransport = entry && !entry.isTransportHidden ? entry.transport : "black";
                    return (
                        <div key={turn} className={styles.logEntry}>
                            <span className={`${styles.turnNumber} ${isRevealTurn ? styles.revealTurn : ""}`}>{turn}</span>
                            <span className={`${styles.transport} ${entry ? styles.filled : ""}`}>{entry ? <TransportIcon type={handleHiddenTransport} className={styles.transportIcon} colour={TRANSPORT_COLOURS[handleHiddenTransport]} /> : "---"}</span>
                            {shouldRevealPosition && entry && entry.position && <span className={styles.position}>{entry.position}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
