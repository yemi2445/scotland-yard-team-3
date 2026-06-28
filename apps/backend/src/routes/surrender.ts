import { Router } from "express";
import { nickApi } from "../nickApi";

const router = Router();

router.post("/api/games/:gameId/surrender/:playerId", async (req, res) => {
    const {gameId, playerId } = req.params;

    try {
        const result = await nickApi.surrender(
            Number(playerId),
            Number(gameId)
        );

        return res.status(201).json({
            success: true,
            result,
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message })
    }
});


export default router;