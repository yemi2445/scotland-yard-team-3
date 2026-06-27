import { Router } from "express";
import { nickApi } from "../nickApi";

const router = Router();
    
    router.post("/api/games", async (req, res) => {
    const { name, mapId, gameLength } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }

    try {
        // Step 1: Create the game on Nick's server
        const game = await nickApi.createGame(name, mapId || 1, gameLength || "short");

        // Step 2: Join the game as the first player
        const player = await nickApi.joinGame(game.gameId, name);

        return res.status(201).json({
            success: true,
            game: {
                pin: String(game.gameId),
                status: "waiting",
                mapId: game.mapId,
                players: [player],
                currentRound: 0,
                totalRounds: 24,
                travelLog: [],
            },
            playerId: String(player.playerId),
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;