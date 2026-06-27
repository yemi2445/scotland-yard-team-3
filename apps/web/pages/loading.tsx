import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "../components/Loading.module.css";
import { loadingGif } from "@packages/assets";

export default function GifBackgroundPage() {
    const [fadeOut, setFadeOut] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const goNext = () => {
            setFadeOut(true);
            setTimeout(() => {
                router.push("/welcome");
            }, 800);
        };

        window.addEventListener("keydown", goNext);
        window.addEventListener("click", goNext);

        return () => {
            window.removeEventListener("keydown", goNext);
            window.removeEventListener("click", goNext);
        };
    }, []);

    return (
        <div className={`${styles.page} ${fadeOut ? styles["fade-out"] : ""}`} style={{backgroundImage: `url(${loadingGif.src})`}}>
            <div className={styles["overlay-text"]}>Leeds Files - Manhunt</div>
            <div className={styles["continue-text"]}>Press any button to continue</div>
        </div>
    );
}
