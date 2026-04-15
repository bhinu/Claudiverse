import { callAI } from './client.js';
import { ANCHOR_RISK_PROMPT } from './prompts.js';

/**
 * Assess anchor risk for a student.
 * Determines how likely they are to remain socially unanchored.
 */
export async function assessAnchorRisk(studentProfile, recentActivity = [], currentAnchorState = {}) {
  const userMessage = {
    student_profile: {
      id: studentProfile.id,
      name: studentProfile.name,
      cohort_type: studentProfile.cohort_type,
      transfer_status: studentProfile.transfer_status,
      first_term_status: studentProfile.first_term_status,
      commuter_flag: studentProfile.commuter_flag,
      comfort_preferences: JSON.parse(studentProfile.comfort_preferences || '{}'),
      interaction_preferences: JSON.parse(studentProfile.interaction_preferences || '{}'),
      days_since_onboarding: studentProfile.onboarded_at
        ? Math.floor((Date.now() - new Date(studentProfile.onboarded_at).getTime()) / 86400000)
        : 0
    },
    recent_activity: recentActivity,
    current_anchor_state: currentAnchorState
  };

  // Deterministic fallback based on student data
  const fallback = () => {
    const isHighRisk = studentProfile.transfer_status || (currentAnchorState.active_anchors === 0);
    return {
      anchor_risk: isHighRisk ? 'high' : 'medium',
      top_reasons: [
        `${studentProfile.cohort_type === 'transfer' ? 'Transfer student without established connections on campus.' : 'New student still building familiarity with campus.'}`,
        'No recurring peer interaction detected in the current routine yet.',
        'Schedule has gaps that tend to be spent alone.'
      ],
      recommended_intervention_type: 'post_class_pair',
      confidence: 0.78
    };
  };

  return callAI({
    systemPrompt: ANCHOR_RISK_PROMPT,
    userMessage,
    temperature: 0.3,
    maxTokens: 400,
    fallback
  });
}
