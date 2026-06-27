import React from "react";
import { View, StyleSheet, Platform, Dimensions } from "react-native";

interface PhoneFrameProps {
    children: React.ReactNode;
}

/**
 * A wrapper component that provides a phone-like frame when running in a web browser.
 * helps see how the app looks on a mobile device.
 */
export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
    // Only apply the frame if we are on the web platform
    if (Platform.OS !== "web") {
        return <>{children}</>;
    }

    return (
        <View style={styles.webWrapper}>
            <View style={styles.phoneContainer}>
                {/* Visual "Bezel" for the phone */}
                <View style={styles.phoneFrame}>
                    {/* The actual app content */}
                    <View style={styles.screen}>{children}</View>
                </View>
                {/* Home Indicator bar */}
                <View style={styles.homeIndicator} />
            </View>
        </View>
    );
};

const { height: windowHeight } = Dimensions.get("window");

const styles = StyleSheet.create({
    webWrapper: {
        flex: 1,
        backgroundColor: "#222",
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            web: {
                height: "100vh" as any,
                width: "100vw" as any,
            },
            default: {
                flex: 1,
            },
        }),
    },
    phoneContainer: {
        ...Platform.select({
            web: {
                width: 812,
                height: 375,
            },
            default: {
                flex: 1,
                width: "100%",
            },
        }),
        position: "relative",
    },
    phoneFrame: {
        flex: 1,
        backgroundColor: "#000",
        ...Platform.select({
            web: {
                borderRadius: 40,
                padding: 12,
                borderWidth: 2,
                borderColor: "#444",
            },
            default: {
                borderRadius: 0,
                padding: 0,
                borderWidth: 0,
            },
        }),
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
    },
    screen: {
        flex: 1,
        backgroundColor: "#fff",
        ...Platform.select({
            web: {
                borderRadius: 30,
            },
            default: {
                borderRadius: 0,
            },
        }),
        overflow: "hidden",
    },
    homeIndicator: {
        position: "absolute",
        bottom: 20,
        alignSelf: "center",
        width: 120,
        height: 5,
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 10,
        zIndex: 100,
        display: Platform.OS === "web" ? "flex" : "none",
    },
});
