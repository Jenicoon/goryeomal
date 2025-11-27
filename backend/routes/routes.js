import express from "express";
import multer from "multer";

import { solarChat } from "../api/chat.js";
import { solarOCR } from "../api/ocr.js";
import { solarParse } from "../api/parse.js";
import { addEmbedding, searchEmbeddings, listStore } from "../store/vectorStore.js";
import { solarEmbedding } from "../api/embeddings.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Chat
router.post("/chat", async (req, res) => {
    const { messages } = req.body;
    const result = await solarChat(messages);
    res.json(result);
});

// OCR
router.post("/ocr", upload.single("document"), async (req, res) => {
    const result = await solarOCR(req.file.buffer, req.file.originalname);
    res.json(result);
});

// Parse
router.post("/parse", upload.single("document"), async (req, res) => {
    const result = await solarParse(req.file.buffer, req.file.originalname);
    res.json(result);
});

// Embeddings 저장
router.post("/embeddings", async (req, res) => {
  const { text, id, metadata } = req.body || {};
  if (!text) return res.status(400).json({ error: "text required" });
  try {
    const embedding = await solarEmbedding(text);
    const docId = id || `doc-${Date.now()}`;
    addEmbedding(docId, embedding, text, metadata || {});
    res.json({ id: docId, message: "saved" });
  } catch (err) {
    console.error("Embedding error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 벡터 검색
router.post("/search", async (req, res) => {
  const { query, topK = 5 } = req.body || {};
  if (!query) return res.status(400).json({ error: "query required" });
  try {
    const qVec = await solarEmbedding(query);
    const results = searchEmbeddings(qVec, topK);
    res.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 저장된 임베딩 목록
router.get("/embeddings/list", (req, res) => {
  const store = listStore();
  res.json({ count: store.length, items: store.map(s => ({ id: s.id, text: s.text })) });
});

export default router;
