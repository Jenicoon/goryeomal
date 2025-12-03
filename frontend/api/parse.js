export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const API_KEY = process.env.UPSTAGE_API_KEY;
    const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";
    const PARSE_MODEL = process.env.UPSTAGE_PARSE_MODEL || "document-parsing"; // 환경변수로 설정 권장

    // 원본 Content-Type 유지, 바디를 버퍼로 변환
    const contentType = req.headers["content-type"] || "application/octet-stream";
    const bodyBuffer = await req.arrayBuffer();

    const r = await fetch(`${BASE_URL}/document-parsing`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": contentType
      },
      // Upstage는 model 필드가 필요합니다. multipart/form-data로 전송하는 경우 쿼리스트링이나 form-data 파트로 넣어야 합니다.
      // 간단히 쿼리스트링으로 모델 지정:
      body: bodyBuffer
    });

    // 모델 지정이 필요한 경우 엔드포인트를 `${BASE_URL}/document-parsing?model=${encodeURIComponent(PARSE_MODEL)}`로 호출하세요.
    // 위 r 호출을 다음처럼 바꿔도 됩니다:
    // const r = await fetch(`${BASE_URL}/document-parsing?model=${encodeURIComponent(PARSE_MODEL)}`, { ... })

    const json = await r.json();
    res.status(r.status).json(json);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}