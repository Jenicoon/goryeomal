import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages required" });

    const API_KEY = process.env.UPSTAGE_API_KEY;
    const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";

    const r = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "solar-1-mini-chat", // 사용 중인 챗 모델명으로 변경
        messages
      })
    });

    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "";
    res.json({ content });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}