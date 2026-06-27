import React from "react";
import styles from "./TurnIndicator.module.css";

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
        <div className={styles.indicator}>
            <div className={styles.label}>{titleText}</div>
            <div className={styles.name}>{detailText}</div>
        </div>
    );
};
