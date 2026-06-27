import React from "react";
import { theme } from "./theme";

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary";
    style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, variant = "primary", style }) => {
    const backgroundColor = variant === "primary" ? theme.colours.primary : theme.colours.secondary;

    return (
        <button
            onClick={onClick}
            style={{
                padding: `${theme.spacing.s}px ${theme.spacing.l}px`,
                backgroundColor: backgroundColor,
                color: theme.colours.buttonText,
                border: "none",
                borderRadius: theme.borderRadius,
                cursor: "pointer",
                fontSize: theme.typography.body.fontSize,
                fontWeight: "600",
                transition: "opacity 0.2s",
                ...style,
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
            {children}
        </button>
    );
};
