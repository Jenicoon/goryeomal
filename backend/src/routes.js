import express from "express";
import { createSession, listSessions, getSession, deleteSession, chatHandler } from "./services/chat.js";
import { saveEmbedding, searchEmbeddings, saveEmbeddingHandler, listHandler, listAllEmbeddings, deleteEmbeddingById, searchHandler } from "./services/embeddings.js";

const router = express.Router();

// 세션
router.post("/chat/session", async (req, res) => {
  try {
    const { userId, title } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const s = await createSession(String(userId), String(title || "새 대화"));
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.get("/chat/sessions", async (req, res) => {
  try {
    const userId = String(req.query.userId || "");
    if (!userId) return res.status(400).json({ error: "userId required" });
    const sessions = await listSessions(userId);
    res.json({ sessions });
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.get("/chat/session/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = String(req.query.userId || "");
    if (!userId) return res.status(400).json({ error: "userId required" });
    const data = await getSession(sessionId, userId);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.delete("/chat/session/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const r = await deleteSession(sessionId, String(userId));
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.post("/chat", async (req, res) => {
  try {
    const { userId, sessionId, messages } = req.body || {};
    const r = await chatHandler({ userId, sessionId, messages });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

// 임베딩(텍스트 저장/검색)
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

// 임베딩 전체/삭제/벡터 검색(선택)
router.get("/embeddings/all", async (req, res) => {
  try {
    const userId = String(req.query.userId || "");
    const sessionId = String(req.query.sessionId || "");
    if (!userId) return res.status(400).json({ error: "userId required" });
    const items = await listAllEmbeddings({ userId, sessionId });
    res.json({ items });
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

router.delete("/embeddings/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const r = await deleteEmbeddingById({ id, userId: String(userId) });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

// 실제 벡터 생성 후 검색(Upstage 사용)
router.post("/embeddings/vector-search", async (req, res) => {
  try {
    const { query, userId, sessionId, topK } = req.body || {};
    if (!query || !userId) return res.status(400).json({ error: "query and userId required" });
    const r = await searchHandler(query, String(userId), String(sessionId || ""), Number(topK || 5));
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message || String(e) }); }
});

export default router;