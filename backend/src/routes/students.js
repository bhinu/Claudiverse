import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { assessAnchorRisk } from '../ai/riskModel.js';
import { findRoutineHooks } from '../ai/hookEngine.js';

const router = Router();

// Get all students (for dashboard / demo)
router.get('/', (req, res) => {
  const db = getDb();
  const students = db.prepare('SELECT * FROM students ORDER BY created_at DESC').all();
  res.json(students.map(parseStudentJson));
});

// Get a single student
router.get('/:id', (req, res) => {
  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(parseStudentJson(student));
});

// Onboard a new student (Screen 1: onboarding pulse)
router.post('/onboard', async (req, res, next) => {
  try {
    const {
      name,
      email,
      cohort_type = 'new',
      anchor_preference = 'study_anchor',
      preferred_times = [],
      format_preference = 'pair',
      comfort_filters = {}
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const id = `s-${randomUUID().slice(0, 8)}`;
    const db = getDb();

    const interactionPrefs = {
      format: format_preference,
      duration: '10-15',
      type: anchor_preference,
      preferred_times
    };

    db.prepare(`
      INSERT INTO students (id, name, email, cohort_type, transfer_status, first_term_status, commuter_flag,
        comfort_preferences, interaction_preferences, onboarded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      id, name, email || null, cohort_type,
      cohort_type === 'transfer' ? 1 : 0,
      1,
      comfort_filters.commuter_friendly ? 1 : 0,
      JSON.stringify(comfort_filters),
      JSON.stringify(interactionPrefs)
    );

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    res.status(201).json(parseStudentJson(student));
  } catch (err) {
    next(err);
  }
});

// Update student schedule/courses (post-onboarding data enrichment)
router.put('/:id/schedule', (req, res, next) => {
  try {
    const { academic_contexts, schedule_blocks, location_patterns } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE students SET
        academic_contexts = COALESCE(?, academic_contexts),
        schedule_blocks = COALESCE(?, schedule_blocks),
        location_patterns = COALESCE(?, location_patterns),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      academic_contexts ? JSON.stringify(academic_contexts) : null,
      schedule_blocks ? JSON.stringify(schedule_blocks) : null,
      location_patterns ? JSON.stringify(location_patterns) : null,
      req.params.id
    );

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(parseStudentJson(student));
  } catch (err) {
    next(err);
  }
});

// Get anchor readiness for a student (Screen 2)
router.get('/:id/readiness', async (req, res, next) => {
  try {
    const db = getDb();
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Get recent activity
    const recentSuggestions = db.prepare(
      'SELECT * FROM suggestions WHERE student_id = ? ORDER BY created_at DESC LIMIT 5'
    ).all(req.params.id);

    const activeAnchors = db.prepare(`
      SELECT a.* FROM anchors a
      JOIN anchor_participants ap ON a.id = ap.anchor_id
      WHERE ap.student_id = ?
    `).all(req.params.id);

    // Assess risk via AI
    const riskAssessment = await assessAnchorRisk(
      student,
      recentSuggestions.map(s => ({ type: 'suggestion', status: s.status, created_at: s.created_at })),
      { active_anchors: activeAnchors.length, anchor_states: activeAnchors.map(a => a.anchor_health_state) }
    );

    // Update risk state in DB
    db.prepare('UPDATE students SET anchor_risk_state = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(riskAssessment.anchor_risk, req.params.id);

    // Find routine hooks via AI
    const hooks = await findRoutineHooks(student);

    const bestHook = hooks.candidate_hooks?.[0] || null;

    res.json({
      student_id: req.params.id,
      anchor_risk: riskAssessment,
      best_hook: bestHook,
      all_hooks: hooks.candidate_hooks || [],
      readiness_summary: {
        best_moment: bestHook ? `Right after ${bestHook.context} on ${bestHook.day}` : 'Analyzing your schedule',
        best_format: student.interaction_preferences ? JSON.parse(student.interaction_preferences).format : 'pair',
        estimated_time: bestHook ? `${bestHook.duration_minutes} minutes` : '10 minutes',
        why_fit: bestHook?.reasoning || 'We are finding the best fit for your routine.'
      }
    });
  } catch (err) {
    next(err);
  }
});

function parseStudentJson(student) {
  if (!student) return null;
  return {
    ...student,
    academic_contexts: JSON.parse(student.academic_contexts || '[]'),
    schedule_blocks: JSON.parse(student.schedule_blocks || '[]'),
    location_patterns: JSON.parse(student.location_patterns || '[]'),
    comfort_preferences: JSON.parse(student.comfort_preferences || '{}'),
    interaction_preferences: JSON.parse(student.interaction_preferences || '{}'),
    support_flags: JSON.parse(student.support_flags || '[]')
  };
}

export default router;
