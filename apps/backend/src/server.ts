import express from "express";
import cors from "cors";
import createRoute from "./routes/create";
import getGameRoute from "./routes/getGame";
import joinRoute from "./routes/join";
import startRoute from "./routes/start";
import moveRoute from "./routes/move";
import surrenderRoute from "./routes/surrender";

const app = express();
app.use(express.json());
app.use(cors());

app.use(createRoute);
app.use(getGameRoute);
app.use(joinRoute);
app.use(startRoute);
app.use(moveRoute);
app.use(surrenderRoute);

app.listen(3002, () => {
    console.log("Backend running on port 3002");
});