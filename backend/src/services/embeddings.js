import fetch from "node-fetch";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
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
  const vector = await createEmbedding(text); // number[]
  const row = await prisma.embedding.create({
    data: {
      id: id || undefined,
      userId,
      sessionId,
      text,
      // Prisma Bytes field: store as UTF-8 JSON in bytes
      vector: Buffer.from(JSON.stringify(vector), "utf-8"),
      // metadata column no longer exists in schema; omit
    }
  });
  return { id: row.id, message: "saved" };
}

export async function listHandler(userId, sessionId) {
  const items = await prisma.embedding.findMany({
    where: { userId, sessionId },
    orderBy: { createdAt: "desc" },
    select: { id: true, text: true, createdAt: true, vector: true }
  });
  // 역직렬화
  const mapped = items.map(it => ({
    ...it,
    vector: it.vector ? JSON.parse(Buffer.from(it.vector).toString("utf-8")) : []
  }));
  return { count: mapped.length, items: mapped };
}

export async function searchHandler(query, topK = 5) {
  const qVec = await createEmbedding(query);
  const items = await prisma.embedding.findMany();
  const results = items
    .map(it => {
      const vec = it.vector ? JSON.parse(Buffer.from(it.vector).toString("utf-8")) : [];
      return { id: it.id, text: it.text, score: vec.length ? cosine(qVec, vec) : 0 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return { results };
}

// 텍스트를 저장(사용자/세션 단위)
export async function saveEmbedding({ userId, sessionId, text, vector }) {
  if (!userId) throw new Error("userId required");
  if (!text) throw new Error("text required");
  return prisma.embedding.create({
    data: {
      userId,
      sessionId: sessionId || null,
      text,
      vector: vector || null
    },
    select: { id: true }
  });
}

// 사용자/세션 범위의 검색(유사도 계산은 DB/벡터DB에 따라 구현)
export async function searchEmbeddings({ userId, sessionId, query, topK = 50 }) {
  if (!userId) throw new Error("userId required");
  if (!query) throw new Error("query required");
  const where = { userId, ...(sessionId ? { sessionId } : {}) };
  const rows = await prisma.embedding.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: topK,
    select: { id: true, text: true, vector: true, createdAt: true }
  });

  // Query embedding
  const qVec = await createEmbedding(query);

  // Compute cosine similarity against stored vectors
  const results = rows
    .map(r => {
      const vec = r.vector ? JSON.parse(Buffer.from(r.vector).toString("utf-8")) : [];
      const score = vec.length ? cosine(qVec, vec) : 0;
      return { id: r.id, text: r.text, score, createdAt: r.createdAt };
    })
    .sort((a, b) => b.score - a.score);

  return results;
}

export async function listAllEmbeddings({ userId, sessionId }) {
  const where = { userId, ...(sessionId ? { sessionId } : {}) };
  return prisma.embedding.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, text: true, userId: true, sessionId: true, createdAt: true }
  });
}

export async function deleteEmbeddingById({ id, userId }) {
  const row = await prisma.embedding.findFirst({ where: { id, userId } });
  if (!row) throw new Error("not found");
  await prisma.embedding.delete({ where: { id } });
  return { ok: true };
}

// Backfill vectors for rows that are missing or empty
export async function reindexEmbeddings({ userId, sessionId }) {
  if (!userId) throw new Error("userId required");
  const where = { userId, ...(sessionId ? { sessionId } : {}) };
  const rows = await prisma.embedding.findMany({
    where,
    orderBy: { createdAt: "asc" },
    select: { id: true, text: true, vector: true }
  });
  let updated = 0;
  for (const r of rows) {
    let vecArr = [];
    try { vecArr = r.vector ? JSON.parse(Buffer.from(r.vector).toString("utf-8")) : []; } catch { vecArr = []; }
    if (!Array.isArray(vecArr) || vecArr.length === 0) {
      const v = await createEmbedding(r.text || "");
      await prisma.embedding.update({ where: { id: r.id }, data: { vector: Buffer.from(JSON.stringify(v), "utf-8") } });
      updated += 1;
    }
  }
  return { ok: true, updated };
}