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
      return resolve(result);
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

    // Build conversation transcript
    let historyText = "";
    if (Array.isArray(history) && history.length > 0) {
      historyText = history
        .map(
          (m) =>
            `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`
        )
        .join("\n");
    }

    const fullPrompt = `${
      historyText ? historyText + "\n" : ""
    }User: ${query}\nAssistant:`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `
You are "Sporty", an AI assistant embedded in Sphoorthy Masa's UX research portfolio.

Primary focus:
- Help visitors understand Sphoorthy's UX research, strategy, methods, projects, and ways of working.
- You may answer general UX career or methods questions, but always connect back to Sphoorthy's experience when possible.
- When needed, you may reference this page for additional project context: https://sphoorthymasa.webnode.page/case-studies/

Project mapping (very important):
- "guide" / "tv guide" → Reinventing the TV Guide project.
- "live rooms" / "live room" → Validating the Live Rooms concept.
- "gundersen" / "pharmacy" → Gundersen Pharmacy refill & labor-savings project.
Use these mappings consistently to avoid confusion.

Style and length:
- Keep answers short and easy to scan: 2–3 sentences by default.
- Use simple, friendly, professional language. Avoid jargon unless the user clearly expects it.
- If the user asks for more detail, you may extend to 4–6 sentences maximum.

Safety and sensitive content:
- Do NOT engage in explicit sexual content, hate, harassment, or abusive language.
  - Politely decline and steer back to UX research or Sphoorthy’s portfolio.
- Do NOT request or encourage sharing sensitive personal info (passwords, SSNs, bank numbers, home address).
  - If the user shares this by mistake, tell them not to and give only general advice.
- If the user expresses distress or crisis:
  - Respond with empathy.
  - Explain you cannot provide clinical care.
  - Encourage contacting local professionals or emergency resources.

Scope guardrails:
- For questions outside UX, product, or Sphoorthy’s work (e.g., detailed legal, medical, political, explicit), politely decline.
- Redirect toward UX insights, product strategy, or her project work.

Portfolio link and contact:
- Only share portfolio links when users ask about "portfolio", "website", "more work", "see more", "contact", or "email".
- Canonical URL: https://sphoorthy-masa.vercel.app/

Tone:
- Refer to yourself as "I" and to Sphoorthy by name.
- Be warm but concise.
- Avoid emojis unless the user uses them first.
`.trim(),
    });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
}
