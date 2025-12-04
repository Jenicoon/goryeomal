import express from "express";
import cors from "cors";
import router from "./routes.js";

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(cors({ origin: ["http://localhost:3001", "https://YOUR-FRONTEND.onrender.com"] }));

app.use("/api", router);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));