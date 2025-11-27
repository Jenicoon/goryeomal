import "dotenv/config"; // <-- 변경: dotenv를 모듈 로드 시점에 적용

import express from "express";
import routes from "./routes/routes.js";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
