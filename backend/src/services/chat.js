import fetch from "node-fetch";

export async function chatHandler(messages) {
  const API_KEY = process.env.UPSTAGE_API_KEY;
  const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";
  const model = "solar-pro2"; // 필요 시 변경

  const r = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, messages, stream: false })
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(err);
  }

  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return { content };
}