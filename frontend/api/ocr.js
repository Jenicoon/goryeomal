export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const API_KEY = process.env.UPSTAGE_API_KEY;
    const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";

    const r = await fetch(`${BASE_URL}/document-digitization`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: req,           // 요청 스트림 프록시
      duplex: "half"       // Node18 fetch에 필요
    });

    const json = await r.json();
    res.status(r.status).json(json);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}