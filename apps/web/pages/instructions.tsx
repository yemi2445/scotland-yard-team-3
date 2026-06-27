import React from "react";
import { useRouter } from "next/router";
import styles from "../components/Instructions.module.css";

const Instructions = () => {
    const router = useRouter();

    return (
        <div className={styles.page}>
            <h1 className={styles.pageTitle}>Game Rules</h1>
            <h2 className={styles.heading}>Leeds Files – Manhunt (How to Play)</h2>

            <p className={styles.paragraph}>
                <strong>Leeds Files – Manhunt</strong> is a detective game where one player is the fleeing <strong>Lecturer</strong> and the others are <strong>Students</strong> attempting to find them.
            </p>

            <section className={styles.section}>
                <h3 className={styles.subheading}>Roles:</h3>
                <ul className={styles.list}>
                    <li>
                        <strong>Lecturer</strong> moves secretly around the city.
                    </li>
                    <li>
                        <strong>Students</strong> work together to track him down.
                    </li>
                </ul>
            </section>

            <section className={styles.section}>
                <h3 className={styles.subheading}>Goal:</h3>
                <ul className={styles.list}>
                    <li>
                        <strong>Students</strong> win if any student lands on the <strong>Lecturer’s</strong> location.
                    </li>
                    <li>
                        <strong>Lecturer</strong> wins if he avoids capture until the end of the game or <strong>Students</strong> can’t move.
                    </li>
                </ul>
            </section>

            <section className={styles.section}>
                <h3 className={styles.subheading}>Movement:</h3>
                <ul className={styles.list}>
                    <li>
                        <strong>Students</strong> move using Bicycle, Taxi and Bus tickets.
                    </li>
                    <li>
                        The <strong>Lecturer’s</strong> position is hidden. Only the ticket type is shown.
                    </li>
                    <li>
                        At certain turns, the <strong>Lecturer</strong> must reveal his location.
                    </li>
                </ul>
            </section>

            <section className={styles.section}>
                <h3 className={styles.subheading}>Turns:</h3>
                <ul className={styles.list}>
                    <li>
                        The <strong>Lecturer</strong> moves first, then all students move.
                    </li>
                    <li>
                        <strong>Students</strong> cannot move onto the same space as each other.
                    </li>
                    <li>
                        Used tickets go to the <strong>Lecturer</strong>.
                    </li>
                </ul>
            </section>

            <section className={styles.section}>
                <h3 className={styles.subheading}>Strategy:</h3>
                <ul className={styles.list}>
                    <li>
                        <strong>Students</strong> deduce the
                        <strong> Lecturer’s</strong> location from ticket history and block escape routes.
                    </li>
                    <li>
                        The <strong>Lecturer</strong> misleads and escapes using smart routes and special tickets.
                    </li>
                </ul>
            </section>

            <button className={styles.menuButton} onClick={() => router.push("/welcome")}>
                Main Menu
            </button>
        </div>
    );
};

export default Instructions;
