import { doesEdgeExist, getNodeById, getMapById, LECTURER_MUST_REVEAL_TURNS, SECONDARY_TRANSPORTS, TRANSPORT_ORDER } from "@packages/utils";
import { createEndpoint, createEndpointError } from "../endpoint";
import { games, findNextNonSpectatorIndex } from "../game";
import { Game, MakeMoveResponse, Move } from "@packages/types";

export function incrementToNextPlayer(game: Game) {
    const currentTurnIndex = game.players.findIndex((p) => p.id === game.currentTurn);
    const startIndex = currentTurnIndex + 1;
    const { index, wrapped } = findNextNonSpectatorIndex(game, startIndex);
    if (index === null) return;
    if (wrapped) {
        game.currentRound += 1; // Increment round at the end of each full cycle
    }
    game.currentTurn = game.players[index].id;
}

export function handleMaxRoundEndLogic(game: Game) {
    if (game.currentRound > game.totalRounds) {
        game.status = "finished";
        game.winMessage = "The game has ended! The lecturer has successfully evaded capture for all rounds.";
    }
}

export default createEndpoint<MakeMoveResponse>("post", "/api/games/:pin/move/:playerId", (req) => {
    if (!req.params.pin || typeof req.params.pin !== "string") {
        return createEndpointError(400, "Game pin is required");
    }

    const game = games[req.params.pin];
    if (!game) {
        return createEndpointError(404, `Game with pin ${req.params.pin} not found`);
    }

    if (game.status === "finished") {
        return createEndpointError(400, "Game is already finished");
    }

    const playerId = req.params.playerId;
    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
        return createEndpointError(403, "Player not in game");
    }

    const move: Move = req.body;
    const missingField = !req.body ? "body" : !req.body.transport ? "transport" : !req.body.destination ? "destination" : null;
    if (missingField) {
        return createEndpointError(400, `Missing required field: ${missingField}`);
    }

    console.log(`[Game ${game.pin}] Received move from ${playerId}:`, move);

    const transportType = move.transport;
    if (!TRANSPORT_ORDER.includes(transportType)) {
        return createEndpointError(400, "Invalid transport type");
    }

    const mapDef = getMapById(game.mapId);
    const destinationNode = getNodeById(mapDef.nodes, move.destination);
    const previousNode = getNodeById(mapDef.nodes, player.position);
    if (!previousNode || !destinationNode) {
        return createEndpointError(400, "Invalid current or destination position");
    }

    if (!doesEdgeExist(mapDef.nodes, previousNode.id, destinationNode.id, move.transport)) {
        return createEndpointError(400, "Invalid move: No such edge with the specified transport");
    }

    const lecturer = game.players.find((p) => p.isLecturer);
    if (!lecturer) {
        return createEndpointError(500, "Game has no lecturer");
    }

    if (!player.tickets[transportType] || player.tickets[transportType] <= 0) {
        return createEndpointError(400, "Invalid move: Not enough tickets");
    }

    const secondaryTransportType = move.secondaryTransport;
    if (secondaryTransportType && !SECONDARY_TRANSPORTS.includes(secondaryTransportType)) {
        return createEndpointError(400, "Invalid secondary transport type");
    }

    if (secondaryTransportType && (!player.tickets[secondaryTransportType] || player.tickets[secondaryTransportType] <= 0)) {
        return createEndpointError(400, "Invalid move: Not enough secondary transport tickets");
    }

    if (!game.currentTurn || game.currentTurn !== playerId) {
        return createEndpointError(403, `It's ${game.currentTurn}'s turn`);
    }

    for (const p of game.players) {
        if (!p.isSpectator && !p.isLecturer && p.id !== playerId && p.position === move.destination) {
            return createEndpointError(400, "Invalid move: Another player is already at the destination");
        }
    }

    player.position = move.destination;
    player.tickets[transportType] -= 1;
    if (secondaryTransportType) {
        player.tickets[secondaryTransportType] -= 1;
    }

    // Unused logic, maybe future update in which lecturer can only use tickets previously used by detectives? like the real game card game pool
    // Nick said just give lecturer infinite tickets
    // if (!player.isLecturer) {
    //     // Prevent lecturer gaining infinite tickets
    //     lecturer.tickets[transportType] += 1;
    // }

    if (player.isLecturer) {
        const turn = game.travelLog.length + 1;
        game.travelLog.push({
            turn: turn,
            transport: move.transport,
            position: move.destination,
            isRevealed: LECTURER_MUST_REVEAL_TURNS.includes(turn),
            isTransportHidden: secondaryTransportType ? secondaryTransportType === "black" : false,
        });
    }

    if (move.secondaryTransport === "x2") {
        game.currentRound += 1; // Skip all the detectives' turns and move to the next round giving the lecturer an extra turn
    } 
    else {
        // Normal turn progression: move to the next player or next round if at the end of the player list
        if (!player.isLecturer && player.position === lecturer.position) {
            game.status = "finished";
            game.winMessage = `${player.name} has caught the lecturer and wins the game!`;
            return { success: true, newState: move };
        }

        incrementToNextPlayer(game);
    }

    handleMaxRoundEndLogic(game);

    return { success: true, newState: move };
});
