import express from "express";
import multer from "multer";
import { chatHandler, createSession, listSessions, getSession } from "./services/chat.js";
import { ocrHandler } from "./services/ocr.js";
import { parseHandler } from "./services/parse.js";
import { saveEmbeddingHandler, searchHandler, listHandler } from "./services/embeddings.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Chat sessions
router.post("/chat/session", async (req, res) => {
  try {
    const { userId, title } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const s = await createSession(userId, title || "새 대화");
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.get("/chat/sessions", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const list = await listSessions(String(userId));
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.get("/chat/session/:id", async (req, res) => {
  try {
    const { userId } = req.query;
    const sessionId = req.params.id;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const data = await getSession(sessionId, String(userId));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

// Send message in a session
router.post("/chat", async (req, res) => {
  try {
    const { messages, sessionId, userId } = req.body || {};
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages required" });
    const result = await chatHandler(messages, sessionId, userId);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

// OCR/Parse/Embeddings 기존 라우트 유지
router.post("/ocr", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "document required" });
    const result = await ocrHandler(req.file);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.post("/parse", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "document required" });
    const result = await parseHandler(req.file);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.post("/embeddings", async (req, res) => {
  try {
    const { text, id, metadata, sessionId = "default", userId = "anonymous" } = req.body || {};
    if (!text) return res.status(400).json({ error: "text required" });
    const result = await saveEmbeddingHandler(text, id, metadata, sessionId, userId);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.post("/search", async (req, res) => {
  try {
    const { query, topK = 5 } = req.body || {};
    if (!query) return res.status(400).json({ error: "query required" });
    const result = await searchHandler(query, topK);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.get("/embeddings/list", async (req, res) => {
  try {
    const { userId, sessionId } = req.query;
    const list = await listHandler(String(userId || "anonymous"), String(sessionId || "default"));
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

export default router;