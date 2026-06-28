import { Router } from "express";
import { nickApi } from "../nickApi";

const router = Router();

router.post("/api/games/:gameId/players", async (req, res) => {
    const { gameId } = req.params;
    const { playerName } = req.body;

    if (!playerName) {
        return res.status(400).json({ error: "playerName is required" });
    }

    try {
        const cleanId = Number(gameId.replace("-", ""));
        const player = await nickApi.joinGame(cleanId, playerName);

        return res.status(201).json({
            success: true,
            playerId: String(player.playerId),
            game: {
                pin: String(gameId),
                status: "waiting",
                mapId: 1,
                players: [player],
                currentRound: 0,
                totalRounds: 24,
                travelLog: [],
            }
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;