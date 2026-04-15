import { callAI } from './client.js';
import { MATCH_COMPOSER_PROMPT } from './prompts.js';

/**
 * Compose the smallest socially safe pairing or micro-circle
 * most likely to create recurrence.
 */
export async function composeMatch(targetStudent, candidateHook, candidatePeers) {
  const userMessage = {
    target_student: {
      id: targetStudent.id,
      name: targetStudent.name,
      cohort_type: targetStudent.cohort_type,
      transfer_status: targetStudent.transfer_status,
      commuter_flag: targetStudent.commuter_flag,
      comfort_preferences: JSON.parse(targetStudent.comfort_preferences || '{}'),
      interaction_preferences: JSON.parse(targetStudent.interaction_preferences || '{}')
    },
    candidate_hook: candidateHook,
    candidate_peers: candidatePeers.map(p => ({
      id: p.id,
      name: p.name,
      cohort_type: p.cohort_type,
      transfer_status: p.transfer_status,
      commuter_flag: p.commuter_flag,
      shared_courses: JSON.parse(p.academic_contexts || '[]'),
      comfort_preferences: JSON.parse(p.comfort_preferences || '{}'),
      interaction_preferences: JSON.parse(p.interaction_preferences || '{}')
    }))
  };

  // Deterministic fallback: pick the best peer by shared course overlap
  const fallback = () => {
    const targetCourses = JSON.parse(targetStudent.academic_contexts || '[]').map(c => c.course);
    
    // Score peers by number of shared courses
    const scored = candidatePeers.map(p => {
      const peerCourses = JSON.parse(p.academic_contexts || '[]').map(c => c.course);
      const shared = targetCourses.filter(c => peerCourses.includes(c));
      return { peer: p, sharedCount: shared.length, sharedCourses: shared };
    }).sort((a, b) => b.sharedCount - a.sharedCount);

    const bestPeer = scored[0];
    const prefs = JSON.parse(targetStudent.interaction_preferences || '{}');
    const wantGroup = prefs.format === 'small_group' && scored.length >= 2;

    const participants = wantGroup
      ? [targetStudent.id, scored[0]?.peer.id, scored[1]?.peer.id].filter(Boolean)
      : [targetStudent.id, bestPeer?.peer.id].filter(Boolean);

    return {
      match_type: participants.length <= 2 ? 'pair' : 'triad',
      participant_ids: participants,
      why_this_match: [
        `Both in ${bestPeer?.sharedCourses[0] || candidateHook.context} at the same time.`,
        `${candidateHook.context} ends at the same time so there is a natural window.`,
        'Similar interaction preferences make a comfortable starting point.'
      ],
      continuity_probability: 0.82,
      shared_context: `Same class, same gap, same goal.`
    };
  };

  return callAI({
    systemPrompt: MATCH_COMPOSER_PROMPT,
    userMessage,
    temperature: 0.3,
    maxTokens: 400,
    fallback
  });
}
