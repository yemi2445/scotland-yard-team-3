import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { TransportType } from "@packages/types";

export const TransportIcon: React.FC<{ type: string; className?: string; size?: number; colour?: string }> = ({ type, size = 24, colour = "white" }) => {
    const iconProps = { size, color: colour };

    switch (type as TransportType) {
        case "yellow":
            return <MaterialIcons name="local-taxi" {...iconProps} />;
        case "green":
            return <MaterialIcons name="directions-bus" {...iconProps} />;
        case "red":
            return <MaterialIcons name="directions-subway" {...iconProps} />;
        case "black":
            return <MaterialIcons name="help-outline" {...iconProps} />;
        case "x2":
            return <MaterialIcons name="filter-2" {...iconProps} />;
        default:
            return null;
    }
};