import express from "express";
import pkg from "@prisma/client";
import multer from "multer";
import { createSession, listSessions, getSession, deleteSession, chatHandler } from "./services/chat.js";
import { ocrHandler } from "./services/ocr.js";
import { parseHandler } from "./services/parse.js";
import { saveEmbeddingHandler, searchEmbeddings, listAllEmbeddings, deleteEmbeddingById, reindexEmbeddings } from "./services/embeddings.js";

const router = express.Router();
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
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
    console.error("/chat/sessions error:", e);
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
    console.error("/chat/session/:id error:", e);
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
  } catch (e) { console.error("/chat error:", e); res.status(500).json({ error: e.message || String(e) }); }
});

// OCR/Parse/Embeddings 기존 라우트 유지
router.post("/ocr", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "document required" });
    const result = await ocrHandler(req.file);
    res.json(result);
  } catch (e) { console.error("/ocr error:", e); res.status(500).json({ error: e.message || String(e) }); }
});

router.post("/parse", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "document required" });
    const result = await parseHandler(req.file);
    res.json(result);
  } catch (e) { console.error("/parse error:", e); res.status(500).json({ error: e.message || String(e) }); }
});

router.post("/embeddings", async (req, res) => {
  try {
    const { userId, sessionId, text } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!text) return res.status(400).json({ error: "text required" });
    try {
      const r = await saveEmbeddingHandler(text, undefined, null, String(sessionId || ""), String(userId));
      res.json({ message: "saved", id: r.id, vector: true });
    } catch (e) {
      // Fallback: save without vector so UX doesn't break; user can reindex later
      console.error("/embeddings save vector failed, fallback:", e);
      const r2 = await prisma.embedding.create({
        data: {
          userId: String(userId),
          sessionId: String(sessionId || ""),
          text,
          vector: null,
          metadata: null
        },
        select: { id: true }
      });
      res.json({ message: "saved (no vector)", id: r2.id, vector: false, error: e?.message || String(e) });
    }
  } catch (e) { console.error("/embeddings error:", e); res.status(500).json({ error: e.message || String(e) }); }
});

// Convenience: GET /embeddings -> list by user/session
router.get("/embeddings", async (req, res) => {
  try {
    const userId = String(req.query.userId || "");
    const sessionId = String(req.query.sessionId || "");
    if (!userId) return res.status(400).json({ error: "userId required" });
    const list = await prisma.embedding.findMany({
      where: { userId, ...(sessionId ? { sessionId } : {}) },
      orderBy: { createdAt: "desc" },
      select: { id: true, text: true, createdAt: true, sessionId: true }
    });
    res.json({ items: list });
  } catch (e) {
    console.error("/embeddings GET error:", e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

router.post("/search", async (req, res) => {
  try {
    const { userId, sessionId, query } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!query) return res.status(400).json({ error: "query required" });
    const results = await searchEmbeddings({ userId: String(userId), sessionId: String(sessionId || ""), query });
    res.json({ results });
  } catch (e) { console.error("/search error:", e); res.status(500).json({ error: e.message || String(e) }); }
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
    console.error("/embeddings/all error:", e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Reindex vectors for existing embeddings (backfill)
router.post("/embeddings/reindex", async (req, res) => {
  try {
    const { userId, sessionId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const r = await reindexEmbeddings({ userId: String(userId), sessionId: String(sessionId || "") });
    res.json(r);
  } catch (e) {
    console.error("/embeddings/reindex error:", e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Health endpoint
router.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
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