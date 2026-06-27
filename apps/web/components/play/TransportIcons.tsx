import React from "react";
import { MdDirectionsBike, MdLocalTaxi, MdDirectionsBus, MdHelpOutline, MdFilter2 } from "react-icons/md";
import { TransportType } from "@packages/types";

export const TransportIcon: React.FC<{ type: string; className?: string, colour?: string }> = ({ type, className, colour }) => {
    switch (type as TransportType) {
        case "bike":
            return <MdDirectionsBike className={className} style={{ color: colour }} />;
        case "taxi":
            return <MdLocalTaxi className={className} style={{ color: colour }} />;
        case "bus":
            return <MdDirectionsBus className={className} style={{ color: colour }} />;
        case "black":
            return <MdHelpOutline className={className} style={{ color: colour }} />;
        case "x2":
            return <MdFilter2 className={className} style={{ color: colour }} />;
        default:
            return null;
    }
};
