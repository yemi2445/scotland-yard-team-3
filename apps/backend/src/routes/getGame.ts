import { Router } from "express";
import { nickApi } from "../nickApi";

const router = Router();

router.get("/api/games/:gameID", async (req, res) => {
    const { gameID } = req.params;

    try{
        const game = await nickApi.getGame(Number(gameID));

        return res.status(200).json({
            sucess: true,
            game: {
                pin: String(game.gameID),
                statis: game.state === "open" ? "waitng" : game.state === "over" ? "finished" : "active",
                mapID: game.mapID,
                players:game.players,
                currentRound: game.round || 0,
                totalRounds: game.length || 24,
                traveLog: [],
                winner: game.winner,
            }
        });

    } catch (err: any) {
        return res.status(404).json({ error: err.message});
    }

});

export default router;
