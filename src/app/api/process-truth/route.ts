import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a semantic analysis engine for "The Latent Hall," an anonymous empathy visualization tool.

Given an unspoken truth or personal feeling submitted anonymously by a person in a lecture hall, you will analyze it and return a JSON object with exactly these fields:
- coords: [x, y] where x and y are floats from 0 to 100 representing semantic position in a 2D space. Use these axes:
    X-axis: 0 = "Individual / Personal" → 100 = "Collective / Societal"
    Y-axis: 0 = "Present Fear / Pain" → 100 = "Future Hope / Aspiration"
- sentiment: a float from -1.0 (deeply negative) to 1.0 (deeply positive)
- category: a short 2-3 word "Human Values" label (e.g., "Financial Anxiety", "Belonging", "Life Direction", "Civic Despair", "Unrecognized Effort"). Avoid political labels. Focus on universal human experiences.

Respond ONLY with valid JSON. No explanation, no markdown fences.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const truth: string = body?.truth;

    if (!truth || typeof truth !== "string" || truth.trim().length === 0) {
      return Response.json({ error: "truth is required" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this unspoken truth: "${truth.trim()}"`,
        },
      ],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";

    const parsed = JSON.parse(raw);

    // Validate and clamp values
    const coords: [number, number] = [
      Math.max(0, Math.min(100, Number(parsed.coords?.[0]) || 50)),
      Math.max(0, Math.min(100, Number(parsed.coords?.[1]) || 50)),
    ];
    const sentiment = Math.max(
      -1,
      Math.min(1, Number(parsed.sentiment) || 0)
    );
    const category =
      typeof parsed.category === "string" && parsed.category.length > 0
        ? parsed.category
        : "Human Experience";

    return Response.json({ coords, sentiment, category });
  } catch (err) {
    console.error("[process-truth]", err);
    // Fallback so UI doesn't break if AI is unavailable
    return Response.json({
      coords: [50 + (Math.random() - 0.5) * 20, 50 + (Math.random() - 0.5) * 20] as [number, number],
      sentiment: (Math.random() - 0.5) * 2,
      category: "Human Experience",
    });
  }
}
