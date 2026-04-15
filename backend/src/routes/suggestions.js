import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { findRoutineHooks } from '../ai/hookEngine.js';
import { composeMatch } from '../ai/matchComposer.js';
import { generateInvitation } from '../ai/invitationGen.js';
import { planContinuity } from '../ai/continuityPlanner.js';

const router = Router();

// Generate a new anchor suggestion for a student (Screen 3)
router.post('/generate', async (req, res, next) => {
  try {
    const { student_id } = req.body;
    if (!student_id) return res.status(400).json({ error: 'student_id is required' });

    const db = getDb();
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Step 1: Find routine hooks
    const hookResult = await findRoutineHooks(student);
    const bestHook = hookResult.candidate_hooks?.[0];
    if (!bestHook) {
      return res.json({ suggestion: null, message: 'No suitable routine hooks found yet. Try updating your schedule.' });
    }

    // Step 2: Find candidate peers (students with overlapping courses)
    const studentCourses = JSON.parse(student.academic_contexts || '[]').map(c => c.course);
    const allStudents = db.prepare('SELECT * FROM students WHERE id != ?').all(student_id);

    const candidatePeers = allStudents.filter(peer => {
      const peerCourses = JSON.parse(peer.academic_contexts || '[]').map(c => c.course);
      return peerCourses.some(c => studentCourses.includes(c));
    });

    if (candidatePeers.length === 0) {
      return res.json({ suggestion: null, message: 'Looking for students in your classes. Check back soon.' });
    }

    // Step 3: Compose match via AI
    const matchResult = await composeMatch(student, bestHook, candidatePeers);

    // Step 4: Generate invitation via AI
    const invitation = await generateInvitation(matchResult, bestHook, bestHook.hook_type === 'post_class_gap' ? 'recap' : 'study');

    // Step 5: Plan continuity via AI
    const continuity = await planContinuity(
      { hook: bestHook, match: matchResult, purpose: 'recap' },
      { day: bestHook.day, time: bestHook.time, context: bestHook.context },
      { format: matchResult.match_type, participants: matchResult.participant_ids?.length || 2 }
    );

    // Save suggestion
    const suggestionId = `sug-${randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO suggestions (id, student_id, routine_hook, participants, purpose, location,
        duration_minutes, invitation_title, invitation_body, cta_primary, cta_secondary,
        continuity_plan, confidence_score, relevance_reasons)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      suggestionId,
      student_id,
      JSON.stringify(bestHook),
      JSON.stringify(matchResult.participant_ids || []),
      bestHook.hook_type === 'post_class_gap' ? 'recap' : 'study',
      bestHook.location || 'TBD',
      bestHook.duration_minutes || 10,
      invitation.title,
      invitation.body,
      invitation.cta_primary || 'Join',
      invitation.cta_secondary || 'Pick another time',
      JSON.stringify(continuity),
      matchResult.continuity_probability || 0.5,
      JSON.stringify(matchResult.why_this_match || [])
    );

    const suggestion = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(suggestionId);

    res.json({
      suggestion: {
        ...suggestion,
        routine_hook: JSON.parse(suggestion.routine_hook || '{}'),
        participants: JSON.parse(suggestion.participants || '[]'),
        continuity_plan: JSON.parse(suggestion.continuity_plan || '{}'),
        relevance_reasons: JSON.parse(suggestion.relevance_reasons || '[]')
      },
      match: matchResult,
      invitation,
      continuity
    });
  } catch (err) {
    next(err);
  }
});

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
      `Head to ${suggestion.location}. Say your name and start with the prompt on screen.`
    );

    const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(interactionId);
    res.json({
      ...interaction,
      participants: JSON.parse(interaction.participants || '[]')
    });
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
    relevance_reasons: JSON.parse(s.relevance_reasons || '[]')
  })));
});

export default router;
