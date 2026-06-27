import { Request } from "express";
import { createEndpoint, createEndpointError } from "../endpoint";
import { games, startGameByPin } from "../game";
import { JoinGameResponse } from "@packages/types";
import { CreatePlayerId, isAllowedColour, isColourTaken, GetBlankTickets } from "../player";

import { ALLOWED_PLAYER_COLOURS, MAX_PLAYERS, PlayerColour } from "@packages/utils";

export default createEndpoint<JoinGameResponse>("post", "/api/games/:pin/join", (req: Request) => {
    const { pin } = req.params;
    const { name } = req.body;

    const game = games[pin];

    console.log(`[Game] Player ${name} attempting to join game ${pin}`);

    if (!game) {
        return createEndpointError(404, `Game with pin ${pin} not found`);
    }

    if (game.status === "finished") {
        return createEndpointError(400, `Game with pin ${pin} is not accepting new players`);
    }

    const currentPlayers = game.players.length;

    if (currentPlayers >= MAX_PLAYERS) {   
    return createEndpointError(409, `Game with pin ${pin} is full`);
    }

    if (!name || typeof name !== "string" || name.trim() === "") {
        return createEndpointError(400, "Name is required to join a game");
    }

    const cleanedName = name.trim();
    const duplicateName = game.players.some( (p) => p.name.trim().toLowerCase() === cleanedName.toLowerCase() );
    
    if (duplicateName) {
        return createEndpointError(409,`Name '${cleanedName}' is already taken`);
    }

    const willSpectate = game.status === "active";
    let colour: PlayerColour | null = null;
    if (!willSpectate) {
        const requested = req.body.colour
        if (!requested) {
            return createEndpointError(400, "Colour is required to join a game");
        }
    
        if (!isAllowedColour(requested)) {
            return createEndpointError(400, `Invalid colour. Allowed: ${ALLOWED_PLAYER_COLOURS.join(", ")}`);
        }
    
        colour = requested;
        if (isColourTaken(game, colour)) {
            return createEndpointError(409, `Colour '${colour}' is already taken`);
        }
    }

    const playerId = CreatePlayerId(game);
    if (!playerId) {
        return createEndpointError(500, "Failed to generate unique player ID");
    }

    game.players.push({
        id: playerId,
        name: cleanedName,
        colour: willSpectate ? "grey" : colour!, // Spectators get a default grey colour
        isLecturer: false,
        isHost: false,
        isSpectator: willSpectate,
        position: 0,
        tickets: GetBlankTickets(),
    });

    const newCount = game.players.length;

    if (newCount === MAX_PLAYERS && game.status === "waiting") {
        const startResult = startGameByPin(pin);

        if ("error" in startResult) {
            return createEndpointError(startResult.status!, startResult.error!);
        }

    console.log(`[Game] Game ${pin} auto-started at ${MAX_PLAYERS} players`);
    }

    console.log(`[Game] Player ${cleanedName} joined game ${pin} with ID ${playerId}`);

    return { success: true, playerId, game };
});
