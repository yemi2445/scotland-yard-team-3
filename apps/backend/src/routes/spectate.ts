import { SpectateGameResponse, UpdateGameResponse } from "@packages/types";
import { AVAILABLE_MAPS, MAX_ROUNDS, MIN_ROUNDS } from "@packages/utils";
import { createEndpoint, createEndpointError } from "../endpoint";
import { games } from "../game";

export default createEndpoint<SpectateGameResponse>("post", "/api/games/:pin/spectate", (req) => {
    const { pin } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
        return createEndpointError(400, "Missing playerId in request body");
    }

    const game = games[pin];
    if (!game) {
        return createEndpointError(404, `Game with pin ${pin} not found`);
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
        return createEndpointError(404, `Player with ID ${playerId} not found in game ${pin}`);
    }

    if (!player.isHost) {
        return createEndpointError(403, `Player with ID ${playerId} is not the host of game ${pin}`);
    }

    player.isSpectator = !player.isSpectator;

    return { success: true, spectatorModeEnabled: player.isSpectator };
});
