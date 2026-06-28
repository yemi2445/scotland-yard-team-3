import { Router } from "express";
import { nickApi } from "../nickApi";

const router = Router();

router.post("/api/games/:gameId/move/:playerId", async (req, res) => {
    const { gameId, playerId } = req.params;
    const { ticket, destination } = req.body;

    if (!ticket || !destination) {
        return res.status(400).json({ error: "ticket and destination are required" });
    }

    try {
        const result = await nickApi.makeMove(
            Number(playerId),
            Number(gameId),
            ticket,
            destination
        );

        return res.status(201).json({
            success: true,
            newState: result,
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;