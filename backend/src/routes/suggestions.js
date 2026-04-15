import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { findRoutineHooks } from '../ai/hookEngine.js';
import { composeMatch } from '../ai/matchComposer.js';
import { generateInvitation } from '../ai/invitationGen.js';
import { planContinuity } from '../ai/continuityPlanner.js';
import { computePlacement } from '../ai/placementEngine.js';

const router = Router();

/**
 * Preflight validation: check that all required inputs exist
 * before attempting full anchor generation.
 */
function preflightValidation(student) {
  const missing = [];
  const courses = JSON.parse(student.academic_contexts || '[]');
  const schedule = JSON.parse(student.schedule_blocks || '[]');

  if (!courses.length) missing.push('class_selection');

  const hasTime = courses.some(c => c.time);
  if (!hasTime) missing.push('class_time');

  const hasBuilding = courses.some(c => c.building);
  if (!hasBuilding) missing.push('location_zone');

  if (!schedule.length && !courses.some(c => c.days?.length)) {
    missing.push('schedule_days');
  }

  const prefs = JSON.parse(student.interaction_preferences || '{}');
  if (!prefs.format) missing.push('format_preference');

  return missing;
}

// Generate a new anchor suggestion for a student (Screen 3)
router.post('/generate', async (req, res) => {
  const { student_id } = req.body;

  if (!student_id) {
    return res.json({
      status: 'missing_required_data',
      missing_fields: ['student_id'],
      suggestion: null
    });
  }

  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);

  if (!student) {
    return res.json({
      status: 'missing_required_data',
      missing_fields: ['student_id'],
      suggestion: null
    });
  }

  // Step 0: Preflight validation
  const missingFields = preflightValidation(student);
  if (missingFields.length > 0) {
    return res.json({
      status: 'missing_required_data',
      missing_fields: missingFields,
      suggestion: null
    });
  }

  try {
    // Step 1: Find routine hooks
    const hookResult = await findRoutineHooks(student);
    const bestHook = hookResult.candidate_hooks?.[0];

    if (!bestHook) {
      return res.json({
        status: 'no_anchor_for_class',
        reason: 'no_routine_hooks',
        suggestion: null
      });
    }

    // Step 2: Find candidate peers (students with overlapping courses)
    const studentCourses = JSON.parse(student.academic_contexts || '[]').map(c => c.course);
    const allStudents = db.prepare('SELECT * FROM students WHERE id != ?').all(student_id);

    const candidatePeers = allStudents.filter(peer => {
      const peerCourses = JSON.parse(peer.academic_contexts || '[]').map(c => c.course);
      return peerCourses.some(c => studentCourses.includes(c));
    });

    if (candidatePeers.length === 0) {
      return res.json({
        status: 'no_anchor_for_class',
        reason: 'no_peer_overlap',
        suggestion: null
      });
    }

    // Step 3: Compose match via AI
    const matchResult = await composeMatch(student, bestHook, candidatePeers);

    // Step 4: Compute placement — friction-aware location selection
    const matchedParticipantIds = matchResult.participant_ids || [student_id];
    const matchedParticipants = matchedParticipantIds
      .map(pid => pid === student_id ? student : allStudents.find(s => s.id === pid))
      .filter(Boolean);

    const gapMinutes = bestHook.duration_minutes ? bestHook.duration_minutes + 10 : 25;
    const placement = await computePlacement(matchedParticipants, bestHook, gapMinutes);

    // If placement needs clarification, return as missing data
    if (placement.clarification_needed) {
      return res.json({
        status: 'missing_required_data',
        missing_fields: ['location_zone'],
        clarification_prompt: placement.clarification_prompt,
        suggestion: null
      });
    }

    // Step 5: Generate invitation
    const finalLocation = placement.recommended_location || bestHook.location || 'TBD';
    const invitation = await generateInvitation(
      { ...matchResult, location: finalLocation, placement },
      { ...bestHook, location: finalLocation },
      bestHook.hook_type === 'post_class_gap' ? 'recap' : 'study'
    );

    // Step 6: Plan continuity
    const continuity = await planContinuity(
      { hook: bestHook, match: matchResult, purpose: 'recap', location: finalLocation },
      { day: bestHook.day, time: bestHook.time, context: bestHook.context },
      { format: matchResult.match_type, participants: matchResult.participant_ids?.length || 2 }
    );

    // Save suggestion
    const suggestionId = `sug-${randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO suggestions (id, student_id, routine_hook, participants, purpose, location,
        duration_minutes, invitation_title, invitation_body, cta_primary, cta_secondary,
        continuity_plan, placement_data, confidence_score, relevance_reasons)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      suggestionId,
      student_id,
      JSON.stringify(bestHook),
      JSON.stringify(matchResult.participant_ids || []),
      bestHook.hook_type === 'post_class_gap' ? 'recap' : 'study',
      finalLocation,
      bestHook.duration_minutes || 10,
      invitation.title,
      invitation.body,
      invitation.cta_primary || 'Join',
      invitation.cta_secondary || 'Pick another time',
      JSON.stringify(continuity),
      JSON.stringify(placement),
      matchResult.continuity_probability || 0.5,
      JSON.stringify(matchResult.why_this_match || [])
    );

    const suggestion = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(suggestionId);

    return res.json({
      status: 'anchor_ready',
      suggestion: {
        ...suggestion,
        routine_hook: JSON.parse(suggestion.routine_hook || '{}'),
        participants: JSON.parse(suggestion.participants || '[]'),
        continuity_plan: JSON.parse(suggestion.continuity_plan || '{}'),
        placement_data: JSON.parse(suggestion.placement_data || '{}'),
        relevance_reasons: JSON.parse(suggestion.relevance_reasons || '[]')
      },
      match: matchResult,
      invitation,
      placement,
      continuity
    });
  } catch (err) {
    console.error(`[ANCHOR_GENERATION_ERROR] ${err.message}`, err.stack);

    return res.json({
      status: 'service_error',
      error_code: classifyError(err),
      suggestion: null
    });
  }
});

/**
 * Classify an error into a safe error code.
 * Never exposes raw error messages to the client.
 */
function classifyError(err) {
  const msg = (err.message || '').toLowerCase();

  if (msg.includes('timeout') || msg.includes('timed out')) return 'ANCHOR_FETCH_TIMEOUT';
  if (msg.includes('econnrefused') || msg.includes('enotfound')) return 'AI_SERVICE_UNREACHABLE';
  if (msg.includes('rate') || msg.includes('429')) return 'AI_RATE_LIMITED';
  if (msg.includes('openai') || msg.includes('azure')) return 'AI_SERVICE_ERROR';
  if (msg.includes('sqlite') || msg.includes('database')) return 'DATABASE_ERROR';
  return 'INTERNAL_ERROR';
}

// Accept a suggestion (creates an interaction)
router.post('/:id/accept', (req, res, next) => {
  try {
    const db = getDb();
    const suggestion = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(req.params.id);
    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });

    db.prepare('UPDATE suggestions SET status = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run('accepted', req.params.id);

    // Create an interaction
    const interactionId = `int-${randomUUID().slice(0, 8)}`;
    const hook = JSON.parse(suggestion.routine_hook || '{}');
    const placement = JSON.parse(suggestion.placement_data || '{}');

    db.prepare(`
      INSERT INTO interactions (id, suggestion_id, participants, scheduled_at, location,
        duration_minutes, purpose, icebreaker_prompt, arrival_instructions, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')
    `).run(
      interactionId,
      req.params.id,
      suggestion.participants,
      hook.time ? `${hook.day} ${hook.time}` : 'TBD',
      suggestion.location,
      suggestion.duration_minutes,
      suggestion.purpose,
      'What part of today felt most useful or confusing?',
      placement.arrival_note || `Head to ${suggestion.location}. Say your name and start with the prompt on screen.`
    );

    const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(interactionId);
    res.json({
      ...interaction,
      participants: JSON.parse(interaction.participants || '[]'),
      placement_data: placement
    });
  } catch (err) {
    next(err);
  }
});

// Request a closer spot for a suggestion
router.post('/:id/closer-spot', async (req, res, next) => {
  try {
    const db = getDb();
    const suggestion = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(req.params.id);
    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });

    const placement = JSON.parse(suggestion.placement_data || '{}');

    if (placement.fallback_location) {
      db.prepare('UPDATE suggestions SET location = ?, placement_data = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(
          placement.fallback_location,
          JSON.stringify({
            ...placement,
            recommended_location: placement.fallback_location,
            recommended_building: placement.fallback_building,
            fallback_location: null,
            fallback_building: null,
            fit_reason: `Switched to ${placement.fallback_location} for a shorter walk.`
          }),
          req.params.id
        );

      res.json({
        location: placement.fallback_location,
        message: `Moved to ${placement.fallback_location} for a shorter walk.`
      });
    } else {
      res.json({
        location: suggestion.location,
        message: 'This is already the closest option we found.'
      });
    }
  } catch (err) {
    next(err);
  }
});

// Decline a suggestion
router.post('/:id/decline', (req, res, next) => {
  try {
    const { reason } = req.body;
    const db = getDb();

    db.prepare('UPDATE suggestions SET status = ?, decline_reason = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run('declined', reason || null, req.params.id);

    res.json({ status: 'declined', message: 'No worries. We will find a better fit.' });
  } catch (err) {
    next(err);
  }
});

// Get suggestions for a student
router.get('/student/:studentId', (req, res) => {
  const db = getDb();
  const suggestions = db.prepare(
    'SELECT * FROM suggestions WHERE student_id = ? ORDER BY created_at DESC'
  ).all(req.params.studentId);

  res.json(suggestions.map(s => ({
    ...s,
    routine_hook: JSON.parse(s.routine_hook || '{}'),
    participants: JSON.parse(s.participants || '[]'),
    continuity_plan: JSON.parse(s.continuity_plan || '{}'),
    placement_data: JSON.parse(s.placement_data || '{}'),
    relevance_reasons: JSON.parse(s.relevance_reasons || '[]')
  })));
});

export default router;
