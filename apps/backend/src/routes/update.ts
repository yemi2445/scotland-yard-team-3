import { UpdateGameResponse } from "@packages/types";
import { AVAILABLE_MAPS, MAX_ROUNDS, MIN_ROUNDS } from "@packages/utils";
import { createEndpoint, createEndpointError } from "../endpoint";
import { games } from "../game";

export default createEndpoint<UpdateGameResponse>("post", "/api/games/:pin/update", (req) => {
    const { pin } = req.params;
    const { playerId, totalRounds, mapId } = req.body;

    if (!playerId) {
        return createEndpointError(400, "Missing playerId in request body");
    }

    if (totalRounds === undefined && mapId === undefined) {
        return createEndpointError(400, "At least one setting must be provided: totalRounds or mapId");
    }

    const game = games[pin];
    if (!game) {
        return createEndpointError(404, `Game with pin ${pin} not found`);
    }

    if (game.status !== "waiting") {
        return createEndpointError(400, "Game settings can only be updated before the game starts");
    }

    if (!game.players.some((p) => p.id === playerId && p.isHost)) {
        return createEndpointError(403, `Player with ID ${playerId} is not the host of game ${pin}`);
    }

    if (totalRounds !== undefined) {
        const parsed = Number(totalRounds);
        if (!Number.isInteger(parsed) || parsed < MIN_ROUNDS || parsed > MAX_ROUNDS) {
            return createEndpointError(400, `totalRounds must be an integer between ${MIN_ROUNDS} and ${MAX_ROUNDS}`);
        }
        game.totalRounds = parsed;
    }

    if (mapId !== undefined) {
        if (!AVAILABLE_MAPS.some((m) => m.id === mapId)) {
            return createEndpointError(400, `Invalid mapId: ${mapId}`);
        }
        game.mapId = mapId;
    }

    return { success: true, game };
});
