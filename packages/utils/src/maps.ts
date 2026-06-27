import { MapData } from "./mapNodes";

import { default as leeds_center_map_nodes } from "../nodes/leeds_center_map_nodes.json";
import { default as palm_city_map_nodes } from "../nodes/palm_city_map_nodes.json";

export type MapId = "leeds_center_map" | "leeds_center_inverted_map" | "palm_city_map";

export interface MapDefinition {
    id: MapId;
    name: string;
    nodes: MapData;
    startingPositions: {
        detectives: number[];
        lecturer: number[];
    }
    dimensions: { width: number; height: number };
    exportFileName: string;
}

export const AVAILABLE_MAPS: MapDefinition[] = [
    {
        id: "leeds_center_map",
        name: "Leeds City Center",
        nodes: leeds_center_map_nodes as MapData,
        startingPositions: {
            detectives: [4, 6, 7, 11, 15, 23, 32, 40, 41],
            lecturer: [33, 35, 38, 39, 42]
        },
        dimensions: { width: 903, height: 846 },
        exportFileName: "leeds_center_map_nodes.json",
    },
    {
        id: "leeds_center_inverted_map",
        name: "Inverted Leeds City Center",
        nodes: leeds_center_map_nodes as MapData,
        startingPositions: {
            detectives: [4, 6, 7, 11, 15, 23, 32, 40, 41],
            lecturer: [33, 35, 38, 39, 42]
        },
        dimensions: { width: 903, height: 846 },
        exportFileName: "leeds_center_inverted_map_nodes.json",
    },
    {
        id: "palm_city_map",
        name: "Palm City",
        nodes: palm_city_map_nodes as MapData,
        startingPositions: {
            detectives: [1, 2, 7, 20, 32, 34, 40, 41],
            lecturer: [14, 17, 25, 30, 39]
        },
        dimensions: { width: 1024, height: 1024 },
        exportFileName: "palm_city_map_nodes.json",
    },
];

export const DEFAULT_MAP_ID: MapId = "leeds_center_map";

export function getMapById(id: string): MapDefinition {
    return AVAILABLE_MAPS.find((m) => m.id === id) ?? AVAILABLE_MAPS[0];
}