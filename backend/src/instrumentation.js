/**
 * Anchor — Instrumentation Logger
 *
 * Logs structured events for product analytics.
 * In production this would forward to a real analytics service.
 * For the MVP, events are logged to console with structured JSON.
 */

const events = [];

export function logEvent(eventName, data = {}) {
  const event = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...data
  };

  events.push(event);

  // In production: forward to analytics service
  // For MVP: structured console log
  console.log(`[EVENT] ${eventName}`, JSON.stringify(data));
}

export function getRecentEvents(limit = 50) {
  return events.slice(-limit);
}

// Convenience methods for core instrumentation events per spec

export const track = {
  // Onboarding
  onboardingStarted: (studentId) =>
    logEvent('onboarding_started', { student_id: studentId }),
  onboardingCompleted: (studentId) =>
    logEvent('onboarding_completed', { student_id: studentId }),
  classSelected: (studentId, courseCode) =>
    logEvent('class_selected', { student_id: studentId, course: courseCode }),

  // Context
  contextBuilt: (studentId, courseCount) =>
    logEvent('context_built', { student_id: studentId, courses: courseCount }),

  // Anchor generation
  preflightStarted: (studentId) =>
    logEvent('anchor_preflight_started', { student_id: studentId }),
  preflightFailedMissingData: (studentId, fields) =>
    logEvent('anchor_preflight_failed_missing_data', { student_id: studentId, missing_fields: fields }),
  generationStarted: (studentId) =>
    logEvent('anchor_generation_started', { student_id: studentId }),
  generationSucceeded: (studentId, suggestionId) =>
    logEvent('anchor_generation_succeeded', { student_id: studentId, suggestion_id: suggestionId }),
  generationNoAnchorFound: (studentId, reason) =>
    logEvent('anchor_generation_no_anchor_found', { student_id: studentId, reason }),
  generationServiceError: (studentId, errorCode) =>
    logEvent('anchor_generation_service_error', { student_id: studentId, error_code: errorCode }),

  // Suggestion actions
  suggestionShown: (studentId, suggestionId) =>
    logEvent('suggestion_shown', { student_id: studentId, suggestion_id: suggestionId }),
  suggestionAccepted: (studentId, suggestionId) =>
    logEvent('suggestion_accepted', { student_id: studentId, suggestion_id: suggestionId }),
  suggestionDeclined: (studentId, suggestionId, reason) =>
    logEvent('suggestion_declined', { student_id: studentId, suggestion_id: suggestionId, reason }),
  closerSpotRequested: (studentId, suggestionId) =>
    logEvent('suggestion_closer_spot_requested', { student_id: studentId, suggestion_id: suggestionId }),

  // Interactions
  interactionStarted: (studentId, interactionId) =>
    logEvent('interaction_started', { student_id: studentId, interaction_id: interactionId }),
  interactionCompleted: (studentId, interactionId) =>
    logEvent('interaction_completed', { student_id: studentId, interaction_id: interactionId }),
  reflectionSubmitted: (studentId, interactionId) =>
    logEvent('reflection_submitted', { student_id: studentId, interaction_id: interactionId }),

  // Continuity & Health
  continuityPlanned: (studentId, anchorId) =>
    logEvent('continuity_planned', { student_id: studentId, anchor_id: anchorId }),
  anchorHealthUpdated: (anchorId, state) =>
    logEvent('anchor_health_updated', { anchor_id: anchorId, state }),
  anchorForming: (anchorId) =>
    logEvent('anchor_forming', { anchor_id: anchorId }),
  anchorStable: (anchorId) =>
    logEvent('anchor_stable', { anchor_id: anchorId }),
  anchorStalled: (anchorId) =>
    logEvent('anchor_stalled', { anchor_id: anchorId }),

  // Escalation
  escalationTriggered: (studentId, type) =>
    logEvent('escalation_triggered', { student_id: studentId, escalation_type: type }),

  // Retry actions
  retryClicked: (studentId) =>
    logEvent('anchor_retry_clicked', { student_id: studentId }),
  pickDifferentClassClicked: (studentId) =>
    logEvent('anchor_pick_different_class_clicked', { student_id: studentId })
};
