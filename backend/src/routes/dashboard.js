import { Router } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// Buyer dashboard overview
router.get('/overview', (req, res) => {
  const db = getDb();

  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  const onboardedStudents = db.prepare('SELECT COUNT(*) as count FROM students WHERE onboarded_at IS NOT NULL').get().count;

  const riskBreakdown = db.prepare(`
    SELECT anchor_risk_state, COUNT(*) as count FROM students
    WHERE onboarded_at IS NOT NULL
    GROUP BY anchor_risk_state
  `).all();

  const cohortBreakdown = db.prepare(`
    SELECT cohort_type, COUNT(*) as count FROM students
    WHERE onboarded_at IS NOT NULL
    GROUP BY cohort_type
  `).all();

  const totalAnchors = db.prepare('SELECT COUNT(*) as count FROM anchors').get().count;
  const anchorHealthBreakdown = db.prepare(`
    SELECT anchor_health_state, COUNT(*) as count FROM anchors
    GROUP BY anchor_health_state
  `).all();

  const totalSuggestions = db.prepare('SELECT COUNT(*) as count FROM suggestions').get().count;
  const acceptedSuggestions = db.prepare('SELECT COUNT(*) as count FROM suggestions WHERE status = \'accepted\'').get().count;
  const declinedSuggestions = db.prepare('SELECT COUNT(*) as count FROM suggestions WHERE status = \'declined\'').get().count;

  const totalInteractions = db.prepare('SELECT COUNT(*) as count FROM interactions').get().count;
  const completedInteractions = db.prepare('SELECT COUNT(*) as count FROM interactions WHERE status = \'completed\'').get().count;

  const totalReflections = db.prepare('SELECT COUNT(*) as count FROM reflections').get().count;
  const positiveReflections = db.prepare('SELECT COUNT(*) as count FROM reflections WHERE would_do_again = 1').get().count;

  // Unanchored students (high risk, no active anchors)
  const unanchoredHighRisk = db.prepare(`
    SELECT s.* FROM students s
    WHERE s.anchor_risk_state = 'high'
    AND s.id NOT IN (SELECT student_id FROM anchor_participants)
    AND s.onboarded_at IS NOT NULL
  `).all();

  // Best routine hooks (from accepted suggestions)
  const bestHooks = db.prepare(`
    SELECT routine_hook, COUNT(*) as usage_count FROM suggestions
    WHERE status = 'accepted'
    GROUP BY routine_hook
    ORDER BY usage_count DESC
    LIMIT 5
  `).all();

  res.json({
    overview: {
      total_students: totalStudents,
      onboarded_students: onboardedStudents,
      total_anchors: totalAnchors,
      anchor_formation_rate: onboardedStudents > 0 ? (totalAnchors / onboardedStudents * 100).toFixed(1) : 0,
      suggestion_acceptance_rate: totalSuggestions > 0 ? (acceptedSuggestions / totalSuggestions * 100).toFixed(1) : 0,
      interaction_completion_rate: totalInteractions > 0 ? (completedInteractions / totalInteractions * 100).toFixed(1) : 0
    },
    risk_breakdown: riskBreakdown,
    cohort_breakdown: cohortBreakdown,
    anchor_health: anchorHealthBreakdown,
    suggestions: {
      total: totalSuggestions,
      accepted: acceptedSuggestions,
      declined: declinedSuggestions,
      pending: totalSuggestions - acceptedSuggestions - declinedSuggestions
    },
    interactions: {
      total: totalInteractions,
      completed: completedInteractions
    },
    reflections: {
      total: totalReflections,
      positive: positiveReflections,
      positive_rate: totalReflections > 0 ? (positiveReflections / totalReflections * 100).toFixed(1) : 0
    },
    unanchored_high_risk: unanchoredHighRisk.map(s => ({
      id: s.id,
      name: s.name,
      cohort_type: s.cohort_type,
      days_since_onboarding: s.onboarded_at
        ? Math.floor((Date.now() - new Date(s.onboarded_at).getTime()) / 86400000)
        : null
    })),
    best_hooks: bestHooks.map(h => ({
      hook: JSON.parse(h.routine_hook || '{}'),
      usage_count: h.usage_count
    }))
  });
});

export default router;
