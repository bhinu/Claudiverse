import { callAI } from './client.js';
import { ESCALATION_PROMPT } from './prompts.js';

/**
 * Escalation Engine
 *
 * Offers rerouting or support when no anchor forms.
 * Triggers after repeated declines, no feasible matches,
 * persistent high anchor risk, or stalled anchor states.
 */
export async function evaluateEscalation(student, history) {
  const declineCount = history.declines || 0;
  const stalledAnchors = history.stalled_anchors || 0;
  const noMatchAttempts = history.no_match_attempts || 0;
  const riskState = student.anchor_risk_state || 'high';

  // Determine escalation type based on behavioral signals
  let escalationType = null;
  let actions = [];

  if (declineCount >= 3) {
    escalationType = 'repeated_declines';
    actions = [
      { type: 'class_change', label: 'Try a different class', priority: 1 },
      { type: 'format_change', label: 'Switch to a different format', priority: 2 },
      { type: 'time_change', label: 'Try a different time', priority: 3 }
    ];
  } else if (stalledAnchors >= 2) {
    escalationType = 'stalled_anchors';
    actions = [
      { type: 'format_change', label: 'Try one person instead', priority: 1 },
      { type: 'class_change', label: 'Try a different class', priority: 2 },
      { type: 'human_support', label: 'Talk to someone who can help', priority: 3 }
    ];
  } else if (noMatchAttempts >= 3) {
    escalationType = 'no_feasible_matches';
    actions = [
      { type: 'class_change', label: 'Pick a different class', priority: 1 },
      { type: 'routine_change', label: 'Try a different routine moment', priority: 2 },
      { type: 'human_support', label: 'Get help from a real person', priority: 3 }
    ];
  } else if (riskState === 'high') {
    escalationType = 'persistent_high_risk';
    actions = [
      { type: 'class_change', label: 'Pick a class to anchor around', priority: 1 },
      { type: 'format_change', label: 'Try a different meetup style', priority: 2 }
    ];
  }

  if (!escalationType) {
    return {
      escalation_needed: false,
      escalation_type: null,
      actions: [],
      message: null
    };
  }

  // Use AI for a human message, or fall back to deterministic
  const aiResult = await callAI({
    systemPrompt: ESCALATION_PROMPT,
    userMessage: {
      student_name: student.name,
      student_type: student.cohort_type,
      escalation_type: escalationType,
      decline_count: declineCount,
      stalled_count: stalledAnchors,
      no_match_count: noMatchAttempts,
      risk_state: riskState
    },
    temperature: 0.5,
    maxTokens: 200,
    fallback: () => ({
      message: getFallbackMessage(escalationType),
      recommended_action: actions[0]?.type || 'class_change'
    })
  });

  return {
    escalation_needed: true,
    escalation_type: escalationType,
    actions,
    message: aiResult.message || getFallbackMessage(escalationType),
    recommended_action: aiResult.recommended_action || actions[0]?.type
  };
}

function getFallbackMessage(type) {
  const messages = {
    repeated_declines: 'The suggestions so far have not been a great fit. Let us try a different class or a different time to find something easier.',
    stalled_anchors: 'The connections you started have not turned into something regular yet. A different format or a different class might work better.',
    no_feasible_matches: 'We have not found a strong match in your current classes yet. Picking a different class could open up better options.',
    persistent_high_risk: 'You are still going through campus without a recurring connection. Picking one class to anchor around is the fastest way to change that.'
  };
  return messages[type] || 'Let us try something different to find a connection that fits your week.';
}
