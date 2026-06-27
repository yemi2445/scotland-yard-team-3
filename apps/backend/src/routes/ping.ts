import { createEndpoint } from "../endpoint";

export default createEndpoint("get", "/api/ping", (req) => {
    return { success: true, message: "pong", timestamp: Date.now() };
});
