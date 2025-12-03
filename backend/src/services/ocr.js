import fetch from "node-fetch";

export async function ocrHandler(file) {
  const API_KEY = process.env.UPSTAGE_API_KEY;
  const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";
  const model = "ocr";

  const FormData = (await import("form-data")).default;
  const form = new FormData();
  form.append("document", file.buffer, { filename: file.originalname, contentType: file.mimetype });
  form.append("model", model);

  const r = await fetch(`${BASE_URL}/document-digitization`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form
  });

  const ct = r.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const payload = isJson ? await r.json() : await r.text();

  if (!r.ok) {
    // 항상 JSON으로 에러 반환
    throw new Error(isJson ? JSON.stringify(payload) : payload);
  }

  // 항상 JSON으로 성공 반환
  return isJson ? payload : { text: payload };
}