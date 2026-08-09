import React from "react";
import { MdLocalTaxi, MdDirectionsBus, MdDirectionsSubway, MdHelpOutline, MdFilter2 } from "react-icons/md";
import { TransportType } from "@packages/types";

export const TransportIcon: React.FC<{ type: string; className?: string, colour?: string }> = ({ type, className, colour }) => {
    switch (type as TransportType) {
        case "yellow":
            return <MdLocalTaxi className={className} style={{ color: colour }} />;
        case "green":
            return <MdDirectionsBus className={className} style={{ color: colour }} />;
        case "red":
            return <MdDirectionsSubway className={className} style={{ color: colour }} />;
        case "black":
            return <MdHelpOutline className={className} style={{ color: colour }} />;
        case "x2":
            return <MdFilter2 className={className} style={{ color: colour }} />;
        default:
            return null;
    }
};
