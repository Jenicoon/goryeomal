import fetch from "node-fetch";

export async function parseHandler(file) {
  const API_KEY = process.env.UPSTAGE_API_KEY;
  const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";
  const model = "document-parse"; // 또는 document-parsing (모델명 확인)

  const FormData = (await import("form-data")).default;
  const form = new FormData();
  form.append("document", file.buffer, { filename: file.originalname, contentType: file.mimetype });
  form.append("output_formats", JSON.stringify(["html", "text"]));
  form.append("base64_encoding", JSON.stringify(["table"]));
  form.append("ocr", "auto");
  form.append("coordinates", "true");
  form.append("model", model);

  const r = await fetch(`${BASE_URL}/document-digitization`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form
  });

  const ct = r.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await r.json() : await r.text();

  if (!r.ok) {
    throw new Error(typeof body === "string" ? body : JSON.stringify(body));
  }

  return typeof body === "string" ? { text: body } : body;
}