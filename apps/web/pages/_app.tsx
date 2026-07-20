import type { AppProps } from "next/app";
import { useEffect } from "react";
import "@packages/ui/src/Theme.css";
import { GameStateProvider, useGameState } from "@packages/providers";
import { apiClient } from "@packages/api";

function WebLeaveHandler({ children }: { children: React.ReactNode }) {
    const { game, playerId } = useGameState();

    useEffect(() => {
        if (!game?.pin || !playerId) return;

        const handleLeave = () => {
            console.log("Player Left Game")
        };

        window.addEventListener("pagehide", handleLeave);
        window.addEventListener("beforeunload", handleLeave);

        return () => {
            window.removeEventListener("pagehide", handleLeave);
            window.removeEventListener("beforeunload", handleLeave);
        };
    }, [game?.pin, playerId]);

    return <>{children}</>;
}

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <GameStateProvider>
            <WebLeaveHandler>
                <style jsx global>{`
                    html,
                    body {
                        overflow: hidden;
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        background-color: #1a1a1a;
                    }
                `}</style>
                <Component {...pageProps} />
            </WebLeaveHandler>
        </GameStateProvider>
    );
}
