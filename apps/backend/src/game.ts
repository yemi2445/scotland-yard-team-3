import { Game, Player, TravelLogEntry } from "@packages/types";
import { getRandomPlayerStartPosition, MapId, MAX_ROUNDS } from "@packages/utils";
import { GetBlankTickets, GetTicketsForRole } from "./player";

const MOCK_PLAYERS: Player[] = [
	{
		id: "p1",
		name: "Lecturer",
		isLecturer: true,
		isMock: true,
		isHost: false,
		position: 73,
		tickets: { taxi: 4, bus: 3, bike: 3, black: 5, x2: 2 },
		colour: "#333",
	},
	{
		id: "p2",
		name: "Detective Red",
		isLecturer: false,
        isMock: true,
		isHost: false,
		position: 71,
		tickets: { taxi: 10, bus: 8, bike: 4, black: 0, x2: 0 },
		colour: "#ff0055",
	},
	{
		id: "p3",
		name: "Detective Blue",
		isLecturer: false,
		isHost: false,
        isMock: true,
		position: 29,
		tickets: { taxi: 11, bus: 8, bike: 4, black: 0, x2: 0 },
		colour: "#00aaff",
	},
];

const MOCK_LOGS: TravelLogEntry[] = [
	{ turn: 1, transport: "taxi", isRevealed: false, isTransportHidden: false, position: 45 },
	{ turn: 2, transport: "bus", isRevealed: false, isTransportHidden: false, position: 26 },
	{ turn: 3, transport: "bike", position: 103, isRevealed: true, isTransportHidden: false },
	{ turn: 4, transport: "taxi", isRevealed: true, isTransportHidden: false, position: 103 },
];

export const games: Record<string, Game> = {
	"111-111": {
		pin: "111-111",
		players: MOCK_PLAYERS,
		travelLog: MOCK_LOGS,
        totalRounds: MAX_ROUNDS,
        currentTurn: "p2",
		currentRound: 4,
		status: "active",
		mapId: "leeds_center_inverted_map",
	},
};

export function findNextNonSpectatorIndex(game: Game, startIndex: number) {
    const len = game.players.length;
    if (len === 0) return { index: null, wrapped: false };

    let idx = startIndex % len;
    if (idx < 0) idx += len;

    let attempts = 0;
    let wrapped = startIndex >= len;

    while (attempts < len) {
        if (idx >= len) {
            idx = 0;
            wrapped = true;
        }
        const p = game.players[idx];
        if (!p.isSpectator) {
            return { index: idx, wrapped };
        }
        idx += 1;
        attempts += 1;
    }

    return { index: null, wrapped };
}


export function leaveGameByPlayerId(gamePin: string, playerId: string) {
    const game = games[gamePin];

    if (!game) {
        return { error: "Game not found", status: 404 as const };
    }

    const idx = game.players.findIndex((p) => p.id === playerId);

    if (idx === -1) {
        return { error: "Player not found in this game", status: 404 as const };
    }

    const isHost = game.players[idx].isHost;
    const isLecturer = game.players[idx].isLecturer;

    const wasTheirTurn = game.currentTurn === playerId;

    // remove player
    game.players.splice(idx, 1);

    // if host leaves OR lecturer leaves OR no players remain then delete the game
    if (isHost || isLecturer || game.players.length === 0) {
        delete games[gamePin];
        return { success: true as const, game: null };
    }

    // If it was the leaving player turn assign it to the next non spectator player
    if (wasTheirTurn) {
        const { index } = findNextNonSpectatorIndex(game, idx);
        if (index === null) {
            // No non spectator players left — end the game
            delete games[gamePin];
            return { success: true as const, game: null };
        }
        game.currentTurn = game.players[index].id;
    }

    return { success: true as const, game };
}

export function startGameByPin(gamePin: string, totalRounds?: number, mapId?: MapId) {
    const game = games[gamePin];

    if (!game) {
        return { error: `Game with pin ${gamePin} not found`, status: 404 as const };
    }

    const activePlayers = game.players.filter(p => !p.isSpectator);
    if (activePlayers.length <= 1) {
        return { error: `Cannot start a game with only ${activePlayers.length} non-spectator player(s)`, status: 400 as const };
    }

    if (game.status === "active") {
        return { success: true as const };
    }

    const lecturerId = activePlayers[Math.floor(Math.random() * activePlayers.length)].id;
    const lecturerIndex = game.players.findIndex(p => p.id === lecturerId);
    game.players[lecturerIndex].isLecturer = true;
    
    const lecturerPlayer = game.players.splice(lecturerIndex, 1)[0];
    game.players.unshift(lecturerPlayer);
    
    game.currentRound = 1;
    if (totalRounds) game.totalRounds = totalRounds;
    if (!game.totalRounds) game.totalRounds = MAX_ROUNDS;

    if (mapId) game.mapId = mapId;
    if (!game.mapId) game.mapId = "leeds_center_map";

    for (const player of game.players) {
        if (!player.isSpectator) {
            player.position = getRandomPlayerStartPosition(game, player.isLecturer);
            player.tickets = GetTicketsForRole(player.isLecturer, activePlayers.length, game.totalRounds);
        } else {
            player.position = 0;
            player.tickets = GetBlankTickets();
        }
    }

    game.currentTurn = game.players[0].id;
    game.status = "active";
    
    return { success: true as const };
}