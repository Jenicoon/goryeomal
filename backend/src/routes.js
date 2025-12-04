import express from "express";
import multer from "multer";
import { createSession, listSessions, getSession, deleteSession, chatHandler } from "./services/chat.js";
import { ocrHandler } from "./services/ocr.js";
import { parseHandler } from "./services/parse.js";
import { saveEmbedding, searchEmbeddings, listAllEmbeddings, deleteEmbeddingById } from "./services/embeddings.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Chat sessions
router.post("/chat/session", async (req, res) => {
  try {
    const { userId, title } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const s = await createSession(String(userId), String(title || "새 대화"));
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

router.get("/chat/sessions", async (req, res) => {
  try {
    const userId = String(req.query.userId || "");
    if (!userId) return res.status(400).json({ error: "userId required" });
    const sessions = await listSessions(userId);
    res.json({ sessions });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

router.get("/chat/session/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = String(req.query.userId || "");
    if (!userId) return res.status(400).json({ error: "userId required" });
    const data = await getSession(sessionId, userId);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Delete a session
router.delete("/chat/session/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const r = await deleteSession(sessionId, String(userId));
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
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
    const { userId, sessionId, text } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!text) return res.status(400).json({ error: "text required" });
    const r = await saveEmbedding({ userId: String(userId), sessionId: String(sessionId || ""), text, vector: null });
    res.json({ message: "saved", id: r.id });
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.post("/search", async (req, res) => {
  try {
    const { userId, sessionId, query } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!query) return res.status(400).json({ error: "query required" });
    const results = await searchEmbeddings({ userId: String(userId), sessionId: String(sessionId || ""), query });
    res.json({ results });
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.get("/embeddings/list", async (req, res) => {
  try {
    const { userId, sessionId } = req.query;
    const list = await listHandler(String(userId || "anonymous"), String(sessionId || "default"));
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.get("/embeddings/all", async (req, res) => {
  try {
    const userId = String(req.query.userId || "");
    const sessionId = String(req.query.sessionId || "");
    if (!userId) return res.status(400).json({ error: "userId required" });
    const items = await listAllEmbeddings({ userId, sessionId });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

router.delete("/embeddings/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const r = await deleteEmbeddingById({ id, userId: String(userId) });
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

export default router;