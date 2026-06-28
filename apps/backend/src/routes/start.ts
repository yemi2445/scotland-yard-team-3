import { Router } from "express";
import { nickApi } from "../nickApi";

const router = Router();

router.patch("/api/games/:gameId/start/:playerId", async (req, res) => {
    const { gameId, playerId } = req.params;

    try {
        const result = await nickApi.startGame(Number(gameId), Number(playerId));

        return res.status(200).json({
            success: true,
            game: {
                pin: String(gameId),
                status: "active",
                state: result.state,
            }
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;