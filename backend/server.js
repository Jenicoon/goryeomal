import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./src/routes.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});