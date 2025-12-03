export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const API_KEY = process.env.UPSTAGE_API_KEY;
    const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";
    const OCR_MODEL = process.env.UPSTAGE_OCR_MODEL || "document-digitization"; // 환경변수로 설정 권장

    const contentType = req.headers["content-type"] || "application/octet-stream";
    const bodyBuffer = await req.arrayBuffer();

    const r = await fetch(`${BASE_URL}/document-digitization?model=${encodeURIComponent(OCR_MODEL)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": contentType
      },
      body: bodyBuffer
    });

    const json = await r.json();
    res.status(r.status).json(json);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}