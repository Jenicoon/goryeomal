import "dotenv/config"; // <-- 변경: dotenv를 모듈 로드 시점에 적용

import express from "express";
import routes from "./routes/routes.js";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", routes);

// use PORT env provided by host (Render sets PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
