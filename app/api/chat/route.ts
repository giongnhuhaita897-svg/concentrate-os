import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM =
  "Tôi là trợ lý của Focus OS, một ứng dụng giúp người dùng tập trung, đặt mục tiêu và lập kế hoạch. Tôi có thể giúp gì cho bạn?";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const contents = (messages as { role: string; content: string }[])
      .slice(-20)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content).slice(0, 2000) }],
      }));

    const res = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
      contents,
      config: { systemInstruction: SYSTEM, maxOutputTokens: 4096 },
    });

    return Response.json({ reply: res.text ?? "" });
} catch (e) {
  console.error("CHAT ERROR:", e);
    return Response.json(
      { reply: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại nhé." },
      { status: 500 }
    );
  }
}