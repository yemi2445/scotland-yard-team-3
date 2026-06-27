import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Image, TouchableWithoutFeedback, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationProps } from "../App";
import { loadingGif } from "@packages/assets";

export default function LoadingScreen({ navigation }: NavigationProps) {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    const goNext = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
        }).start(() => {
            navigation.navigate("Welcome");
        });
    };

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <TouchableWithoutFeedback onPress={goNext}>
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                <Image source={loadingGif} style={styles.backgroundGif} resizeMode="contain" />

                <View style={styles.overlay} />

                <SafeAreaView style={styles.content}>
                    <View style={styles.centerContent}>
                        <Text style={styles.title}>Leeds Files - Manhunt</Text>
                    </View>

                    <Animated.Text style={[styles.continueText, { opacity: pulseAnim }]}>Press anywhere to continue</Animated.Text>
                </SafeAreaView>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#6e6e6e", // MUCH closer to your GIF grey
        justifyContent: "center",
        alignItems: "center",
    },

    backgroundGif: {
        position: "absolute",
        width: "80%",
        height: "80%",
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.35)",
    },

    content: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    },

    centerContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    title: {
        fontSize: 48,
        color: "#ffffff",
        textAlign: "center",
        fontFamily: "ImperialScript",
    },

    continueText: {
        position: "absolute",
        bottom: 40,
        fontSize: 20,
        color: "#f2e6d6",
        letterSpacing: 1.5,
        fontFamily: "ImperialScript",
    },
});
