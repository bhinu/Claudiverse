import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You generate casual conversation starters for college students who share something in common.

Given two things two anonymous students posted in the same lecture hall, write ONE short question that could spark a real conversation between them. Rules:
- Sound like a chill classmate asking, not a therapist or life coach
- Keep it casual, specific, and grounded — no philosophical or abstract language
- Under 15 words
- No "What does it mean to you..." or "How does that make you feel..." type questions
- Think: something you'd actually text a friend, not something from a TED talk

Respond ONLY with the question. No quotes, no explanation.`;

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
        : "What's your take on that?";

    return Response.json({ question });
  } catch (err) {
    console.error("[generate-bridge]", err);
    return Response.json({
      question: "Have you two ever talked about this?",
    });
  }
}
