const API_URL = "http://localhost:3002/api";

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
    getMap: (mapId) => makeRequest(`/maps/${mapId}`),
    getGames: () => makeRequest("/games"),
    getGame: (gameId) => makeRequest(`/games/${gameId}`),
    createGame: (name, mapId, gameLength) => makeRequest("/games", "POST", { name, mapId, gameLength }),
    joinGame: (gameId, playerName) => makeRequest(`/games/${gameId}/players`, "POST", { playerName }),
    startGame: (gameId, playerId) => makeRequest(`/games/${gameId}/start/${playerId}`, "PATCH"),
    getPlayer: (playerId) => makeRequest(`/players/${playerId}`),
    getMoves: (playerId) => makeRequest(`/players/${playerId}/moves`),
    makeMove: (playerId, gameId, ticket, destination) => makeRequest(`/players/${playerId}/moves`, "POST", { gameId, ticket, destination }),
    surrender: (playerId, gameId) => makeRequest(`/players/${playerId}/surrender`, "POST", { gameId }),
}