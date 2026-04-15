import { callAI } from './client.js';
import { CONTINUITY_PROMPT } from './prompts.js';

/**
 * Plan the second interaction before the first one fades.
 * Uses the same routine context when possible.
 */
export async function planContinuity(acceptedInteraction, routineOverlap, firstSessionFormat) {
  const userMessage = {
    accepted_interaction: acceptedInteraction,
    routine_overlap: routineOverlap,
    first_session_format: firstSessionFormat
  };

  // Deterministic fallback: same slot next week
  const fallback = () => ({
    second_touch_type: 'same_slot_next_week',
    suggested_day: routineOverlap.day || 'Next week',
    suggested_time: routineOverlap.time || 'Same time',
    duration_minutes: 10,
    purpose: 'Continuing where you left off makes the second meeting easier than the first.',
    invitation_preview: `Same time next ${routineOverlap.day || 'week'}, same spot. Quick check-in after ${routineOverlap.context || 'class'}.`,
    continuity_confidence: 0.80
  });

  return callAI({
    systemPrompt: CONTINUITY_PROMPT,
    userMessage,
    temperature: 0.5,
    maxTokens: 400,
    fallback
  });
}
