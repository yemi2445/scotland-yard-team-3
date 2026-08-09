const API_URL = "http://trinity-developments.co.uk";

const makeRequest = async <T>(endpoint: string, method = "GET", body?: any): Promise<T> => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let errorMessage = "API request failed";
        try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
        } catch {
            errorMessage = `Could not ${method} ${endpoint}: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
    }

    return res.json();
};

export const apiClient = {
    getMaps: () => makeRequest("/maps"),
    getMap: (mapId: any) => makeRequest(`/maps/${mapId}`),
    getGames: () => makeRequest("/games"),
    getGame: (gameId: any) => makeRequest(`/games/${gameId}`),
    createGame: (name: any, mapId: any, gameLength: any) => makeRequest("/games", "POST", { name, mapId, gameLength }),
    joinGame: (gameId: any, playerName: any) => makeRequest(`/games/${gameId}/players`, "POST", { playerName }),
    startGame: (gameId: any, playerId: any) => makeRequest(`/games/${gameId}/start/${playerId}`, "PATCH"),
    getPlayer: (playerId: any) => makeRequest(`/players/${playerId}`),
    getMoves: (playerId: any) => makeRequest(`/players/${playerId}/moves`),
    // x2 has no destination of its own; it must be submitted as its own standalone move (any
    // destination, typically the player's current position) before the two ticket moves it
    // unlocks — the server has no field for combining it with another ticket in one request.
    makeMove: (playerId: any, gameId: any, ticket: any, destination: any) =>
    makeRequest(`/players/${playerId}/moves`, "POST", { gameID: gameId, ticket, destination }),
    surrender: (playerId: any, gameId: any) => makeRequest(`/players/${playerId}/surrender`, "POST", { gameId: gameId }),
    // Nick's server has no dedicated leave/end-game endpoints, so both are backed by surrender —
    // the only way to remove a player's participation. "End Game (Host)" therefore only forces
    // the host's own surrender; it can't unilaterally kick every other player from the game.
    leaveGame: (gameId: any, playerId: any) => makeRequest(`/players/${playerId}/surrender`, "POST", { gameId: gameId }),
    endGame: (gameId: any, playerId: any) => makeRequest(`/players/${playerId}/surrender`, "POST", { gameId: gameId }),
}