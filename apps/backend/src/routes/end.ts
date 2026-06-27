import { createEndpoint, createEndpointError } from "../endpoint";
import { games } from "../game";
import type { EndGameResponse } from "@packages/types";

export default createEndpoint<EndGameResponse>("post", "/api/games/:gamePin/end/:playerId", async (req) => {
    const { gamePin, playerId } = req.params;

    const game = games[gamePin];
    if (!game) {
        return createEndpointError(404, "Game not found");
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
        return createEndpointError(404, "Player not found in this game");
    }

    if (!player.isHost) {
        return createEndpointError(403, "Only the host can end the game");
    }

    delete games[gamePin];
    return { success: true };
});
