import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { TransportType } from "@packages/types";

export const TransportIcon: React.FC<{ type: string; className?: string; size?: number; colour?: string }> = ({ type, size = 24, colour = "white" }) => {
    const iconProps = { size, color: colour };

    switch (type as TransportType) {
        case "bike":
            return <MaterialIcons name="directions-bike" {...iconProps} />;
        case "taxi":
            return <MaterialIcons name="local-taxi" {...iconProps} />;
        case "bus":
            return <MaterialIcons name="directions-bus" {...iconProps} />;
        case "black":
            return <MaterialIcons name="help-outline" {...iconProps} />;
        case "x2":
            return <MaterialIcons name="filter-2" {...iconProps} />;
        default:
            return null;
    }
};