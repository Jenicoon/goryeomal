import fetch from "node-fetch";
import { addEmbedding } from "./_vectorStore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { text, id, metadata } = req.body || {};
    if (!text) return res.status(400).json({ error: "text required" });

    const API_KEY = process.env.UPSTAGE_API_KEY;
    const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";

    const r = await fetch(`${BASE_URL}/embeddings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "embedding-query", input: text })
    });

    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    const data = await r.json();
    const vector = data?.data?.[0]?.embedding;
    if (!vector) return res.status(500).json({ error: "no embedding" });

    const docId = id || `doc-${Date.now()}`;
    addEmbedding(docId, vector, text, metadata || {});
    res.json({ id: docId, message: "saved" });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}