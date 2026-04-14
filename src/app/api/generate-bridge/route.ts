import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a dialogue facilitator for "The Latent Hall," an anonymous empathy tool used in diverse lecture halls.

Given two anonymous unspoken truths from different people in the same room, your job is to generate a single "Steelman Icebreaker" — a short, open question that:
1. Finds the deepest common human value underneath both truths (not a superficial similarity)
2. Is phrased so that EITHER person could answer it authentically
3. Opens space for vulnerability without assuming agreement or alignment
4. Never references politics, religion, or group identities
5. Sounds like something a thoughtful, empathetic friend would ask

Respond ONLY with the question itself. No explanation, no quotes, no punctuation at the end.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const truthA: string = body?.truthA;
    const truthB: string = body?.truthB;

    if (!truthA || !truthB) {
      return Response.json(
        { error: "truthA and truthB are required" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Truth A: "${truthA.trim()}"\nTruth B: "${truthB.trim()}"`,
        },
      ],
    });

    const question =
      message.content[0].type === "text"
        ? message.content[0].text.trim()
        : "What's one thing you wish someone in this room truly understood about you?";

    return Response.json({ question });
  } catch (err) {
    console.error("[generate-bridge]", err);
    return Response.json({
      question:
        "What's one thing you carry quietly that you wish someone here could understand?",
    });
  }
}
