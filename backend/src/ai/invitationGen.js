import { callAI } from './client.js';
import { INVITATION_PROMPT } from './prompts.js';

/**
 * Generate a concrete, low-pressure invitation
 * with clear what/when/where/how long/why.
 */
export async function generateInvitation(matchContext, routineHook, purposeType = 'recap') {
  const userMessage = {
    match_context: matchContext,
    routine_hook: routineHook,
    purpose_type: purposeType
  };

  const participants = matchContext.participant_ids?.length || 2;
  const otherCount = participants - 1;

  // Deterministic fallback with natural-sounding invitation
  const fallback = () => ({
    title: `${routineHook.duration_minutes || 10} min ${purposeType} after ${routineHook.context}`,
    body: `You and ${otherCount === 1 ? 'one other student' : 'two others'} from ${routineHook.context} have the same gap after class on ${routineHook.day}. A short ${purposeType} at ${routineHook.location || 'the commons'} could help you both.`,
    cta_primary: "I'm in",
    cta_secondary: 'Pick another time',
    icebreaker_prompt: purposeType === 'recap'
      ? 'What part of today felt most useful or most confusing?'
      : 'What are you working on this week?',
    arrival_instructions: `Head to ${routineHook.location || 'the meeting point'} around ${routineHook.time}. Say your name and start with the prompt on screen.`
  });

  return callAI({
    systemPrompt: INVITATION_PROMPT,
    userMessage,
    temperature: 0.6,
    maxTokens: 400,
    fallback
  });
}
