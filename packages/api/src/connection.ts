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
    getMap: (mapId: any) => makeRequest(`/maps/${mapId}`),
    getGames: () => makeRequest("/games"),
    getGame: (gameId: any) => makeRequest(`/games/${gameId}`),
    createGame: (name: any, mapId: any, gameLength: any) => makeRequest("/games", "POST", { name, mapId, gameLength }),
    joinGame: (gameId: any, playerName: any) => makeRequest(`/games/${gameId}/players`, "POST", { playerName }),
    startGame: (gameId: any, playerId: any) => makeRequest(`/games/${gameId}/start/${playerId}`, "PATCH"),
    getPlayer: (playerId: any) => makeRequest(`/players/${playerId}`),
    getMoves: (playerId: any) => makeRequest(`/players/${playerId}/moves`),
    makeMove: (playerId: any, gameId: any, ticket: any, destination: any) => makeRequest(`/players/${playerId}/moves`, "POST", { gameId, ticket, destination }),
    surrender: (playerId: any, gameId: any) => makeRequest(`/players/${playerId}/surrender`, "POST", { gameId }),
}