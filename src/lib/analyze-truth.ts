/**
 * Shared AI analysis — used by both the legacy /api/process-truth endpoint
 * and the new room /post endpoint.
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a semantic analysis engine for "The Latent Hall," an anonymous empathy visualization tool.

Given an unspoken truth or personal feeling submitted anonymously by a person in a lecture hall, return a JSON object with exactly these fields:
- coords: [x, y] floats from 0 to 100
    X-axis: 0 = "Individual / Personal" → 100 = "Collective / Societal"
    Y-axis: 0 = "Present Fear / Pain" → 100 = "Future Hope / Aspiration"
- sentiment: float -1.0 (deeply negative) to 1.0 (deeply positive)
- category: 2–3 word "Human Values" label (e.g. "Financial Anxiety", "Belonging", "Life Direction"). Avoid political labels.

Respond ONLY with valid JSON. No markdown, no explanation.`;

export async function analyzeTruth(text: string): Promise<{
  coords: [number, number];
  sentiment: number;
  category: string;
}> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Analyze: "${text.trim()}"` }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    coords: [
      Math.max(0, Math.min(100, Number(parsed.coords?.[0]) || 50)),
      Math.max(0, Math.min(100, Number(parsed.coords?.[1]) || 50)),
    ],
    sentiment: Math.max(-1, Math.min(1, Number(parsed.sentiment) || 0)),
    category: typeof parsed.category === "string" && parsed.category.length > 0
      ? parsed.category
      : "Human Experience",
  };
}
