import fetch from "node-fetch";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export async function createSession(userId, title = "새 대화") {
  const row = await prisma.chatSession.create({ data: { userId, title } });
  return { id: row.id, title: row.title, createdAt: row.createdAt };
}

export async function listSessions(userId) {
  const rows = await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true }
  });
  return { sessions: rows };
}

export async function getSession(sessionId, userId) {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true, title: true, createdAt: true, updatedAt: true }
  });
  if (!session) throw new Error("session not found");
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId, userId },
    orderBy: { createdAt: "asc" }
  });
  return { session, messages };
}

export async function chatHandler(messages, sessionId, userId) {
  if (!sessionId) throw new Error("sessionId required");
  if (!userId) throw new Error("userId required");

  // 저장: 사용자 발화
  for (const m of messages) {
    await prisma.chatMessage.create({
      data: { userId, sessionId, role: m.role, content: m.content }
    });
  }

  // 모델 호출
  const API_KEY = process.env.UPSTAGE_API_KEY;
  const BASE_URL = process.env.UPSTAGE_BASE_URL || "https://api.upstage.ai/v1";
  const model = "solar-pro2";

  const r = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false })
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content || "";

  // 저장: 어시스턴트 응답 + 세션 업데이트 시간
  await prisma.chatMessage.create({ data: { userId, sessionId, role: "assistant", content } });
  await prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

  return { content };
}