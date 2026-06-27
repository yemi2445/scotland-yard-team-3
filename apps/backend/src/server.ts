import express from "express";
import cors  from "cors";
import createRoute from "./routes/create";
import getGameRoute from "./routes/getGame";


const app = express();
app.use(express.json());
app.use(cors());
app.use(getGameRoute);

app.use(createRoute);

app.listen(3002, () => {
    console.log("Backend running on port 3002");
});

