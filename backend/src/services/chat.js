import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createSession(userId, title = "새 대화") {
  return prisma.chatSession.create({
    data: { userId, title },
  });
}

export async function listSessions(userId) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getSession(id, userId) {
  const session = await prisma.chatSession.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) return { messages: [] };
  return {
    id: session.id,
    title: session.title,
    messages: session.messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
  };
}

export async function deleteSession(id, userId) {
  const s = await prisma.chatSession.findFirst({ where: { id, userId } });
  if (!s) return { ok: false, error: "not found" };
  await prisma.chatSession.delete({ where: { id } });
  return { ok: true };
}

export async function chatHandler({ userId, sessionId, messages }) {
  // 데모: 마지막 user 메시지 반사
  const text = messages?.[0]?.content || "";
  if (!sessionId) throw new Error("sessionId required");
  if (!userId) throw new Error("userId required");

  // 대화 저장
  const userMsg = await prisma.message.create({
    data: { sessionId, role: "user", content: text },
  });
  const assistantContent = `Echo: ${text}`;
  const assistantMsg = await prisma.message.create({
    data: { sessionId, role: "assistant", content: assistantContent },
  });
  // 세션 갱신
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });
  return { content: assistantContent, userMsgId: userMsg.id, assistantMsgId: assistantMsg.id };
}