import OpenAI from "openai";

const apiKey = process.env.UPSTAGE_API_KEY;
const openai = new OpenAI({
  apiKey,
  baseURL: "https://api.upstage.ai/v1"
});

export async function solarChat(messages) {
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "solar-pro2",
      messages: messages,
      stream: false
    });
    
    return {
      content: chatCompletion.choices[0].message.content
    };
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
}
