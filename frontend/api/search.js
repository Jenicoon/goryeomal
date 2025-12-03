import fetch from "node-fetch";
import { searchEmbeddings } from "./_vectorStore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { query, topK = 5 } = req.body || {};
    if (!query) return res.status(400).json({ error: "query required" });

    const API_KEY = process.env.UPSTAGE_API_KEY;
    const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";

    const r = await fetch(`${BASE_URL}/embeddings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "embedding-query", input: query })
    });

    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    const data = await r.json();
    const qVec = data?.data?.[0]?.embedding;
    const results = searchEmbeddings(qVec, topK);
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}