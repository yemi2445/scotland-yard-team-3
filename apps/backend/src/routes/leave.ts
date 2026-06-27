import { createEndpoint, createEndpointError } from "../endpoint";
import type { LeaveGameResponse } from "@packages/types";
import { leaveGameByPlayerId } from "../game";

export default createEndpoint<LeaveGameResponse>("post", "/api/games/:gamePin/leave/:playerId", async (req) => {
    const { gamePin, playerId } = req.params;

    const result = leaveGameByPlayerId(gamePin, playerId);

    if ("error" in result) {
        return createEndpointError(result.status!, result.error!);
    }

    return result;
});
