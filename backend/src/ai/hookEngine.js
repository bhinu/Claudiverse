import { callAI } from './client.js';
import { ROUTINE_HOOK_PROMPT } from './prompts.js';

/**
 * Find the lowest-friction moments in a student's real week
 * where repeated interaction can happen naturally.
 */
export async function findRoutineHooks(studentProfile) {
  const academicContexts = JSON.parse(studentProfile.academic_contexts || '[]');
  const scheduleBlocks = JSON.parse(studentProfile.schedule_blocks || '[]');
  const locationPatterns = JSON.parse(studentProfile.location_patterns || '[]');
  const interactionPrefs = JSON.parse(studentProfile.interaction_preferences || '{}');

  const userMessage = {
    student_schedule: scheduleBlocks,
    academic_contexts: academicContexts,
    location_patterns: locationPatterns,
    availability_preferences: interactionPrefs,
    commuter: Boolean(studentProfile.commuter_flag),
    cohort_type: studentProfile.cohort_type
  };

  // Build a deterministic fallback from the student's actual schedule
  const fallback = () => {
    const hooks = [];
    for (const course of academicContexts) {
      if (course.days && course.endTime) {
        const [hours, minutes] = course.endTime.split(':').map(Number);
        const hookTime = `${hours}:${String(minutes + 5).padStart(2, '0')}`;
        
        hooks.push({
          hook_type: 'post_class_gap',
          day: course.days[0],
          time: hookTime,
          duration_minutes: 12,
          context: course.course,
          location: locationPatterns[0] || `${course.building} Lobby`,
          score: 0.85,
          reasoning: `Right after ${course.course} there is a natural gap before the next commitment.`
        });
      }
    }
    return { candidate_hooks: hooks.slice(0, 3) };
  };

  return callAI({
    systemPrompt: ROUTINE_HOOK_PROMPT,
    userMessage,
    temperature: 0.3,
    maxTokens: 600,
    fallback
  });
}
