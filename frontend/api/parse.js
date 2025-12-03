export const config = { api: { bodyParser: false } };

import { parseMultipart } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const API_KEY = process.env.UPSTAGE_API_KEY;
    const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";
    const PARSE_MODEL = process.env.UPSTAGE_PARSE_MODEL || "document-parsing";

    const { fileBuffer, filename, fileContentType } = await parseMultipart(req);

    const form = new FormData();
    const blob = new Blob([fileBuffer], { type: fileContentType });
    form.append("file", blob, filename);
    form.append("model", PARSE_MODEL);

    const r = await fetch(`${BASE_URL}/document-parsing`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`
      },
      body: form
    });

    const ct = r.headers.get("content-type") || "";
    if (!r.ok) {
      const errPayload = ct.includes("application/json") ? await r.json() : await r.text();
      return res.status(r.status).json({ error: errPayload || "Parse request failed" });
    }

    const responseBody = ct.includes("application/json") ? await r.json() : await r.text();
    return res.status(200).json(ct.includes("application/json") ? responseBody : { text: responseBody });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}