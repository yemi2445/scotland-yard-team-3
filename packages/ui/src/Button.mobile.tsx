import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { theme } from "./theme";

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary";
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, variant = "primary", style }) => {
    const backgroundColor = variant === "primary" ? theme.colours.primary : theme.colours.secondary;

    return (
        <TouchableOpacity onPress={onClick} activeOpacity={0.8} style={[styles.button, { backgroundColor }, style]}>
            <Text style={styles.text}>{children}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: theme.spacing.s + 4, // a bit more vertical padding for touch targets
        paddingHorizontal: theme.spacing.l,
        borderRadius: theme.borderRadius,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 150,
    },
    text: {
        color: theme.colours.buttonText,
        fontSize: theme.typography.body.fontSize,
        fontWeight: "600",
    },
});
