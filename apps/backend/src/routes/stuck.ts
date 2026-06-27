import { createEndpoint, createEndpointError } from "../endpoint";
import { StuckGameResponse } from "@packages/types";
import { games } from "../game";
import { handleMaxRoundEndLogic, incrementToNextPlayer } from "./move";

export default createEndpoint<StuckGameResponse>("post", "/api/games/:pin/stuck", (req) => {
        const { pin } = req.params;
        const { playerId } = req.body;

        if (!playerId) {
            return createEndpointError(400, "Missing playerId in request body");
        }

        const game = games[pin];
        if (!game) {
            return createEndpointError(404, `Game with pin ${pin} not found`);
        }

        if (game.status === "finished") {
            return createEndpointError(400, "Game is already finished");
        }

        const player = game.players.find((p) => p.id === playerId);
        if (!player) {
            return createEndpointError(403, "Player not in game");
        }

        const currentTurnPlayer = game.players.find((p) => p.id === game.currentTurn);
        if (!currentTurnPlayer) {
            return createEndpointError(500, "Current turn player not found");
        }

        if (currentTurnPlayer.id !== playerId) {
            return createEndpointError(403, "It's not the player's turn");
        }

        if (player.isLecturer) {
            game.status = "finished";
            game.winMessage = "The game has ended! Somehow the lecturer became stuck? The detectives win by default.";
            return { success: true };
        }

        incrementToNextPlayer(game);
        handleMaxRoundEndLogic(game);
        return { success: true };
    }
);