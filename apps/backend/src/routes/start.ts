import { createEndpoint, createEndpointError } from "../endpoint";
import { StartGameResponse } from "@packages/types";
import { MIN_ROUNDS, MAX_ROUNDS } from "@packages/utils";
import { games, startGameByPin } from "../game";

export default createEndpoint<StartGameResponse>("post", "/api/games/:pin/start", (req) => {
        const { pin } = req.params;
        const { playerId, totalRounds, mapId } = req.body;

        if (!playerId) {
            return createEndpointError(400, "Missing playerId in request body");
        }

        const game = games[pin];

        if (!game) {
            return createEndpointError(404, `Game with pin ${pin} not found`);
        }

        if (!game.players.some((p) => p.id === playerId && p.isHost)) {
            return createEndpointError(403, `Player with ID ${playerId} is not the host of game ${pin}`);
        }

        let rounds: number | undefined;
        if (totalRounds !== undefined) {
            const parsed = Number(totalRounds);
            if (!Number.isInteger(parsed) || parsed < MIN_ROUNDS || parsed > MAX_ROUNDS) {
                return createEndpointError(400, `totalRounds must be an integer between ${MIN_ROUNDS} and ${MAX_ROUNDS}`);
            }
            rounds = parsed;
        }

        const result = startGameByPin(pin, rounds, mapId);

        if ("error" in result) {
            return createEndpointError(result.status!, result.error!);
        }

        return result;
    }
);