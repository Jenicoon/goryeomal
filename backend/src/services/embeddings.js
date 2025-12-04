import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 데모용 인메모리 스토어 (프로덕션은 벡터DB 권장)
const store = []; // { id, vector:number[], text, metadata }

function dot(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0); }
function norm(a) { return Math.sqrt(a.reduce((s, v) => s + v * v, 0)); }
function cosine(a, b) { return dot(a, b) / (norm(a) * norm(b) + 1e-12); }

async function createEmbedding(text) {
  const API_KEY = process.env.UPSTAGE_API_KEY;
  const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";

  const r = await fetch(`${BASE_URL}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "embedding-query", input: text })
  });

  if (!r.ok) {
    throw new Error(await r.text());
  }

  const data = await r.json();
  const vector = data?.data?.[0]?.embedding;
  if (!vector) throw new Error("no embedding in response");
  return vector;
}

export async function saveEmbeddingHandler(text, id, metadata, sessionId = "default", userId = "anonymous") {
  const vector = await createEmbedding(text);
  const row = await prisma.embedding.create({
    data: { id: id || undefined, userId, sessionId, text, vector, metadata: metadata || {} }
  });
  return { id: row.id, message: "saved" };
}

export async function searchHandler(query, topK = 5) {
  const qVec = await createEmbedding(query);
  const results = store
    .map(item => ({ id: item.id, text: item.text, metadata: item.metadata, score: cosine(qVec, item.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return { results };
}

export async function listHandler(userId, sessionId) {
  const items = await prisma.embedding.findMany({
    where: { userId, sessionId },
    orderBy: { createdAt: "desc" },
    select: { id: true, text: true, metadata: true, createdAt: true }
  });
  return { count: items.length, items };
}