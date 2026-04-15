import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { assessAnchorHealth } from '../ai/healthMonitor.js';

const router = Router();

// Get all anchors for a student (Screen 8: anchors tab)
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const db = getDb();
    const anchors = db.prepare(`
      SELECT a.* FROM anchors a
      JOIN anchor_participants ap ON a.id = ap.anchor_id
      WHERE ap.student_id = ?
      ORDER BY a.created_at DESC
    `).all(req.params.studentId);

    // Get participants for each anchor
    const anchorsWithDetails = anchors.map(anchor => {
      const participants = db.prepare(`
        SELECT s.id, s.name, s.cohort_type FROM anchor_participants ap
        JOIN students s ON ap.student_id = s.id
        WHERE ap.anchor_id = ?
      `).all(anchor.id);

      const interactions = db.prepare(
        'SELECT * FROM interactions WHERE anchor_id = ? ORDER BY scheduled_at DESC LIMIT 5'
      ).all(anchor.id);

      return {
        ...anchor,
        routine_context: JSON.parse(anchor.routine_context || '{}'),
        last_interaction_outcome: JSON.parse(anchor.last_interaction_outcome || '{}'),
        participants,
        recent_interactions: interactions
      };
    });

    res.json(anchorsWithDetails);
  } catch (err) {
    next(err);
  }
});

// Create an anchor from a successful interaction pair
router.post('/', (req, res, next) => {
  try {
    const { participant_ids, anchor_type = 'pair', routine_context, purpose_type = 'recap', interaction_id } = req.body;

    if (!participant_ids || participant_ids.length < 2) {
      return res.status(400).json({ error: 'At least 2 participants required' });
    }

    const db = getDb();
    const anchorId = `anc-${randomUUID().slice(0, 8)}`;

    db.prepare(`
      INSERT INTO anchors (id, anchor_type, routine_context, purpose_type, anchor_health_state, first_interaction_at)
      VALUES (?, ?, ?, ?, 'weak', datetime('now'))
    `).run(anchorId, anchor_type, JSON.stringify(routine_context || {}), purpose_type);

    // Add participants
    const insertParticipant = db.prepare('INSERT INTO anchor_participants (anchor_id, student_id) VALUES (?, ?)');
    for (const pid of participant_ids) {
      insertParticipant.run(anchorId, pid);
    }

    // Link interaction if provided
    if (interaction_id) {
      db.prepare('UPDATE interactions SET anchor_id = ? WHERE id = ?').run(anchorId, interaction_id);
    }

    // Log health
    db.prepare(`
      INSERT INTO anchor_health_log (anchor_id, previous_state, new_state, reason)
      VALUES (?, NULL, 'weak', 'Anchor created from first interaction')
    `).run(anchorId);

    const anchor = db.prepare('SELECT * FROM anchors WHERE id = ?').get(anchorId);
    res.status(201).json({
      ...anchor,
      routine_context: JSON.parse(anchor.routine_context || '{}'),
      participant_ids
    });
  } catch (err) {
    next(err);
  }
});

// Update anchor health (called after interactions/reflections)
router.post('/:id/health', async (req, res, next) => {
  try {
    const db = getDb();
    const anchor = db.prepare('SELECT * FROM anchors WHERE id = ?').get(req.params.id);
    if (!anchor) return res.status(404).json({ error: 'Anchor not found' });

    const interactions = db.prepare(
      'SELECT * FROM interactions WHERE anchor_id = ? ORDER BY scheduled_at DESC'
    ).all(req.params.id);

    const interactionIds = interactions.map(i => i.id);
    let reflections = [];
    if (interactionIds.length > 0) {
      const placeholders = interactionIds.map(() => '?').join(',');
      reflections = db.prepare(
        `SELECT * FROM reflections WHERE interaction_id IN (${placeholders})`
      ).all(...interactionIds);
    }

    const healthResult = await assessAnchorHealth(anchor, interactions, reflections);

    // Update anchor health
    const previousState = anchor.anchor_health_state;
    db.prepare('UPDATE anchors SET anchor_health_state = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(healthResult.health_state, req.params.id);

    // Log state change
    db.prepare(`
      INSERT INTO anchor_health_log (anchor_id, previous_state, new_state, reason)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, previousState, healthResult.health_state, healthResult.reasoning);

    res.json(healthResult);
  } catch (err) {
    next(err);
  }
});

export default router;
