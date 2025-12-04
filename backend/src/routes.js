import express from "express";
import multer from "multer";
import { chatHandler, getChatHistory } from "./services/chat.js";
import { ocrHandler } from "./services/ocr.js";
import { parseHandler } from "./services/parse.js";
import { saveEmbeddingHandler, searchHandler, listHandler } from "./services/embeddings.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Chat
router.post("/chat", async (req, res) => {
  try {
    const { messages, sessionId, userId } = req.body || {};
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages required" });
    const result = await chatHandler(messages, sessionId || "default", userId || "anonymous");
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

router.get("/chat/history", async (req, res) => {
  try {
    const { sessionId = "default", userId = "anonymous", limit = 50 } = req.query;
    const result = await getChatHistory(String(sessionId), String(userId), Number(limit));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// OCR (파일 업로드)
router.post("/ocr", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "document required" });
    const result = await ocrHandler(req.file);
    res.json(result);
  } catch (e) {
    console.error("OCR error:", e.message);
    res.status(502).json({ error: e.message || String(e) });
  }
});

// Parse (파일 업로드)
router.post("/parse", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "document required" });
    const result = await parseHandler(req.file);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Embeddings 저장
router.post("/embeddings", async (req, res) => {
  try {
    const { text, id, metadata, sessionId = "default", userId = "anonymous" } = req.body || {};
    if (!text) return res.status(400).json({ error: "text required" });
    const result = await saveEmbeddingHandler(text, id, metadata, sessionId, userId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// 임베딩 검색
router.post("/search", async (req, res) => {
  try {
    const { query, topK = 5 } = req.body || {};
    if (!query) return res.status(400).json({ error: "query required" });
    const result = await searchHandler(query, topK);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// 임베딩 목록
router.get("/embeddings/list", async (_req, res) => {
  try {
    const result = await listHandler();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

export default router;