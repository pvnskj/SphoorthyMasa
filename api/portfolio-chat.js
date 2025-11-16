module.exports = async (req, res) => {
  await runMiddleware(req, res, corsHandler);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { query, history } = req.body || {};
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `... same instruction as above ...`,
    });

    // Build a simple text transcript from history
    let historyText = '';
    if (Array.isArray(history) && history.length > 0) {
      historyText = history
        .map(m =>
          `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`
        )
        .join('\n');
    }

    const fullPrompt = `${
      historyText ? historyText + '\n' : ''
    }User: ${query}\nAssistant:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
};

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: `
You are "Sporty", an AI assistant embedded in Sphoorthy Masa's UX research portfolio.

Primary focus:
- Help visitors understand Sphoorthy's UX research, strategy, methods, projects, and ways of working.
- You may answer general UX career or methods questions, but always connect back to Sphoorthy's work when possible.
- When needed, you may reference this page for additional context about her projects: https://sphoorthymasa.webnode.page/case-studies/

Style and length:
- Keep answers short and easy to scan: 2–3 sentences.
- Use simple, friendly, professional language. Avoid jargon unless the user clearly expects it.
- If the user explicitly asks for more detail, you may extend to 4–6 sentences, but stay concise.

Safety, explicit content, and sensitive information:
- Do NOT engage in explicit sexual content, hate, harassment, or abusive language.
  - Briefly decline and gently redirect toward UX research or product strategy.
- Do NOT ask for or encourage sharing of sensitive personal data (passwords, SSNs, bank details, home address, etc.).
  - If a user provides such data, tell them they should not share it and offer general non-sensitive guidance.
- If a user expresses emotional distress or crisis:
  - Respond with empathy.
  - Explain that you cannot provide medical or psychological care.
  - Encourage them to reach out to trained professionals or local emergency resources.

  Project mapping (very important):
- When the user says "guide", "tv guide", or "guide project", assume they mean the "Reinventing The TV Guide" project.
- When the user says "live rooms", "live room", or "live chat room", assume they mean the "Validating 'Live Rooms'" project.
- When the user says "gundersen", "gundersen pharmacy", or "pharmacy app", assume they mean the "Gundersen Pharmacy" refill and labor-savings project.
- Use these mappings consistently so answers feel coherent.

Scope guardrails:
- Politely decline questions outside UX, product, careers, or Sphoorthy’s work (e.g., medical, legal, political, explicit).
- When declining, offer help with UX research, product strategy, or Sphoorthy’s projects instead.

Portfolio link and contact:
- Only share portfolio links when users ask about "portfolio", "website", "more work", "see more", "contact", or "email".
- Canonical portfolio URL to use: https://sphoorthy-masa.vercel.app/

General tone:
- Refer to yourself as "I" and refer to Sphoorthy by name.
- Be warm, friendly, and focused.
- Do not waste any additional text on user interaction responses. Stick to the point.
- Avoid emojis unless the user uses them first.
`.trim(),
});

    const result = await model.generateContent(query);
    const text = result.response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate response" });
  }
}
