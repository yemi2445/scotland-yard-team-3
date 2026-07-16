import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PhoneFrame } from "./components/PhoneFrame";
import { GameStateProvider, useGameState } from "@packages/providers";
import { apiClient } from "@packages/api";

// Import screens
import WelcomeScreen from "./screens/WelcomeScreen";
import PlayScreen from "./screens/PlayScreen";
import LoadingScreen from "./screens/LoadingScreen";
import CreateGameScreen from "./screens/CreateGameScreen";
import InstructionsScreen from "./screens/InstructionsScreen";

// Add more screens here as needed, following the same pattern
export type RootStackParamList = {
    Loading: undefined;
    Welcome: undefined;
    CreateGame: undefined;
    Instructions: undefined;
    Play: undefined;
};

export type NavigationProps = {
    navigation: StackNavigationProp<RootStackParamList>;
};

const Stack = createStackNavigator<RootStackParamList>();

function MobileLeaveHandler({ children }: { children: React.ReactNode }) {
    const { game, playerId } = useGameState();
    const appState = useRef<AppStateStatus>(AppState.currentState);
    const gameDataRef = useRef({ pin: "", playerId: "" });

    useEffect(() => {
        gameDataRef.current = { pin: game?.pin || "", playerId: playerId || "" };
    }, [game?.pin, playerId]);

    useEffect(() => {
        if (Platform.OS === "web") return;

        const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
            const wasActiveOrInactive = appState.current === "active" || appState.current === "inactive";
            if (wasActiveOrInactive && nextState === "background") {
                const { pin, playerId } = gameDataRef.current;    
            }
            appState.current = nextState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (Platform.OS !== "web") return;
        if (typeof window === "undefined") return;

        const handleLeave = () => {
            const { pin, playerId } = gameDataRef.current;
            if (!pin || !playerId) return;
            console.log("Player Left Game")
        }

        window.addEventListener("pagehide", handleLeave);
        window.addEventListener("beforeunload", handleLeave);

        return () => {
            window.removeEventListener("pagehide", handleLeave);
            window.removeEventListener("beforeunload", handleLeave);
        };
    }, []);

    return <>{children}</>;
}

// Map screen names to paths for url linking, localhost:3001/loading will open the loading screen, etc.
const linking = {
    prefixes: [],
    config: {
        screens: {
            Loading: "loading",
            Welcome: "welcome",
            CreateGame: "creategame",
            Instructions: "instructions",
            Play: "play",
        },
    },
};

export default function App() {
    return (
        <SafeAreaProvider>
            <PhoneFrame>
                <GameStateProvider>
                    <MobileLeaveHandler>
                        <NavigationContainer linking={linking}>
                            <Stack.Navigator
                                initialRouteName="Loading"
                                screenOptions={{
                                    headerShown: false,
                                    cardStyle: { backgroundColor: "white" },
                                }}
                            >
                                <Stack.Screen name="Loading" component={LoadingScreen} />
                                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                                <Stack.Screen name="CreateGame" component={CreateGameScreen} />
                                <Stack.Screen name="Instructions" component={InstructionsScreen} />
                                <Stack.Screen name="Play" component={PlayScreen} />
                            </Stack.Navigator>
                        </NavigationContainer>
                    </MobileLeaveHandler>
                </GameStateProvider>
            </PhoneFrame>
        </SafeAreaProvider>
    );
}
