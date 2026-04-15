import { callAI } from './client.js';
import { HEALTH_MONITOR_PROMPT } from './prompts.js';

/**
 * Assess whether an anchor is becoming real or fading.
 * Returns health state and recommended action.
 */
export async function assessAnchorHealth(anchor, interactions, reflections) {
  const userMessage = {
    anchor: {
      id: anchor.id,
      anchor_type: anchor.anchor_type,
      purpose_type: anchor.purpose_type,
      recurrence_pattern: anchor.recurrence_pattern,
      current_health: anchor.anchor_health_state,
      first_interaction_at: anchor.first_interaction_at,
      last_interaction_outcome: JSON.parse(anchor.last_interaction_outcome || '{}')
    },
    interaction_history: interactions.map(i => ({
      id: i.id,
      scheduled_at: i.scheduled_at,
      status: i.status,
      purpose: i.purpose
    })),
    reflection_data: reflections.map(r => ({
      would_do_again: r.would_do_again,
      was_useful: r.was_useful,
      felt_comfortable: r.felt_comfortable,
      same_group_preferred: r.same_group_preferred
    }))
  };

  // Deterministic fallback based on interaction and reflection counts
  const fallback = () => {
    const completedCount = interactions.filter(i => i.status === 'completed').length;
    const positiveReflections = reflections.filter(r => r.would_do_again && r.was_useful).length;

    if (completedCount >= 3 && positiveReflections >= 2) {
      return { health_state: 'stable', reasoning: 'Multiple completed interactions with positive feedback indicate a stable connection.', recommended_action: 'taper_support', action_detail: 'Reduce prompts and let the anchor continue on its own.' };
    } else if (completedCount >= 1 && positiveReflections >= 1) {
      return { health_state: 'forming', reasoning: 'At least one positive interaction shows early signs of a forming anchor.', recommended_action: 'reinforce', action_detail: 'Schedule the next recurring interaction to strengthen familiarity.' };
    } else if (completedCount >= 1 && positiveReflections === 0) {
      return { health_state: 'stalled', reasoning: 'Interactions happened but feedback was not positive enough to build recurrence.', recommended_action: 'change_format', action_detail: 'Try a different format or a different peer to see if the fit improves.' };
    }
    return { health_state: 'weak', reasoning: 'Not enough interactions have happened to form any real connection yet.', recommended_action: 'reinforce', action_detail: 'Prompt the next interaction soon to keep momentum.' };
  };

  return callAI({
    systemPrompt: HEALTH_MONITOR_PROMPT,
    userMessage,
    temperature: 0.3,
    maxTokens: 300,
    fallback
  });
}
