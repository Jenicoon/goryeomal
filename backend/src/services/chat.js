import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function chatHandler(messages, sessionId = "default", userId = "anonymous") {
  for (const m of messages) {
    await prisma.chatMessage.create({ data: { userId, sessionId, role: m.role, content: m.content } });
  }

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
  await prisma.chatMessage.create({ data: { userId, sessionId, role: "assistant", content } });
  return { content };
}

export async function getChatHistory(sessionId = "default", userId = "anonymous", limit = 50) {
  const rows = await prisma.chatMessage.findMany({
    where: { userId, sessionId },
    orderBy: { createdAt: "asc" },
    take: limit
  });
  return { messages: rows };
}