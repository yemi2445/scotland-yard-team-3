const NICK_API = "http://trinity-developments.co.uk";

async function nickRequest(endpoint: string, method = "GET", body?: any) {
    const res = await fetch(`${NICK_API}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `Request failed: ${res.status}`);
    }
    return res.json();
}

export const nickApi = {
    getMaps: () => nickRequest("/maps"),
    getMap: (mapId: number) => nickRequest(`/maps/${mapId}`),
    getGames: () => nickRequest("/games"),
    getGame: (gameId: number) => nickRequest(`/games/${gameId}`),
    createGame: (name: string, mapId: number, gameLength: string) => nickRequest("/games", "POST", { name, mapId, gameLength }),
    joinGame: (gameId: number, playerName: string) => nickRequest(`/games/${gameId}/players`, "POST", { playerName }),
    startGame: (gameId: number, playerId: number) => nickRequest(`/games/${gameId}/start/${playerId}`, "PATCH"),
    getPlayer: (playerId: number) => nickRequest(`/players/${playerId}`),
    getMoves: (playerId: number) => nickRequest(`/players/${playerId}/moves`),
    makeMove: (playerId: number, gameId: number, ticket: string, destination: number) => nickRequest(`/players/${playerId}/moves`, "POST", { gameId, ticket, destination }),
    surrender: (playerId: number, gameId: number) => nickRequest(`/players/${playerId}/surrender`, "POST", { gameId }),

}


