import { Game } from "@packages/types";
import { getMapById, MapId } from "./maps";

export function getRandomPlayerStartPosition(game: Game, isLecturer: boolean): number {
    const mapId = (game.mapId ?? "leeds_center_map") as MapId;
    const occupiedPositions = game.players.map((p) => p.position);
    const validPositions = isLecturer ? getMapById(mapId).startingPositions.lecturer : getMapById(mapId).startingPositions.detectives;
    const availablePositions = validPositions.filter((pos) => !occupiedPositions.includes(pos));
    if (availablePositions.length === 0) {
        throw new Error("No available starting positions");
    }

    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    return availablePositions[randomIndex];
}
