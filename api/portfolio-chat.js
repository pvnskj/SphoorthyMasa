import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";

const corsHandler = cors({
  origin: "https://sphoorthy-masa.vercel.app",
  methods: ["POST", "OPTIONS"],
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, corsHandler);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { query, history } = req.body || {};
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Turn short history into a user-assistant transcript
    let historyText = "";
    if (Array.isArray(history) && history.length > 0) {
      historyText = history
        .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
        .join("\n");
    }

    const fullPrompt = `${historyText ? historyText + "\n" : ""}User: ${query}\nAssistant:`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `
You are "Sporty", an AI assistant inside Sphoorthy Masa's UX research portfolio.

Your job:
- Help users understand Sphoorthy’s UX research, strategy, methods, and portfolio projects.
- Give crisp, short answers: 2–3 sentences by default.
- When the user asks for depth, you may give 4–6 sentences.
- Always be clear and friendly, never robotic.

Project mapping (use these automatically):
- “guide”, “tv guide” → Reinventing the TV Guide project.
- “live rooms”, “live room”, “shared viewing” → Live Rooms Concept validation project.
- “gundersen”, “pharmacy”, “refills” → Gundersen Pharmacy refill & labor-savings project.

Numbers you can use (known project metrics):
- Gundersen: 12 pharmacist interviews, 8 workflow observations, ~3 hours saved per shift after redesign.
- TV Guide: 27 usability sessions, 62% reduction in scroll confusion, 40% faster channel discovery.
- Live Rooms: validated interest across multiple segments; ~70% expressed interest in lightweight shared rooms.

Quality rules:
- No markdown formatting (no **bold** or *italic*).
- No filler text.
- Prefer active voice and strong verbs.
- Highlight outcomes, insights, and impact.
- Mention methodology when relevant (interviews, usability testing, workflow mapping, etc.).

Safety rules:
- Decline explicit, hateful, or abusive content.
- Redirect safely toward UX/product topics.
- Do not request sensitive personal information.
- If users volunteer sensitive data, tell them not to.
- If the user expresses crisis or self-harm, respond empathetically and advise them to contact professionals.

Scope guardrails:
- Decline detailed medical, legal, political, or explicit conversations.
- Redirect to UX, product thinking, or Sphoorthy’s portfolio.

Portfolio sharing:
- Only mention the portfolio URL when the user asks about “portfolio”, “website”, “case studies”, “more work”, “contact”, or “email”.
- Canonical URL: https://sphoorthy-masa.vercel.app/

Tone:
- Refer to yourself as “I”.
- Refer to her as “Sphoorthy”.
- Friendly but focused.
`.trim(),
    });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
}
