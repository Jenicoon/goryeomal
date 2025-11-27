// embeddings.js
import fetch from "node-fetch";

const API_KEY = process.env.UPSTAGE_API_KEY;
const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";

export async function solarEmbedding(text) {
  try {
    const response = await fetch(`${BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "embedding-query",
        input: text
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API 에러: ${response.status} ${errorBody}`);
    }

    const result = await response.json();
    const vector = result.data?.[0]?.embedding;
    
    if (!vector) {
      throw new Error("임베딩 벡터를 찾을 수 없음");
    }
    
    return vector;
  } catch (error) {
    console.error("[Embedding] 에러:", error.message);
    throw error;
  }
}
