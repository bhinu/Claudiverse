import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';

const router = Router();

// Get interaction details (Screen 4)
router.get('/:id', (req, res) => {
  const db = getDb();
  const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(req.params.id);
  if (!interaction) return res.status(404).json({ error: 'Interaction not found' });

  // Get participant names
  const participantIds = JSON.parse(interaction.participants || '[]');
  let participants = [];
  if (participantIds.length > 0) {
    const placeholders = participantIds.map(() => '?').join(',');
    participants = db.prepare(`SELECT id, name, cohort_type FROM students WHERE id IN (${placeholders})`).all(...participantIds);
  }

  res.json({
    ...interaction,
    participants,
    participant_ids: participantIds
  });
});

// Get interactions for a student
router.get('/student/:studentId', (req, res) => {
  const db = getDb();
  const interactions = db.prepare(`
    SELECT i.* FROM interactions i
    WHERE i.participants LIKE ?
    ORDER BY i.scheduled_at DESC
  `).all(`%${req.params.studentId}%`);

  res.json(interactions.map(i => ({
    ...i,
    participants: JSON.parse(i.participants || '[]')
  })));
});

// Update interaction status (mark as completed, in_progress, missed)
router.put('/:id/status', (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['upcoming', 'in_progress', 'completed', 'missed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const db = getDb();
    db.prepare('UPDATE interactions SET status = ? WHERE id = ?').run(status, req.params.id);

    const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(req.params.id);
    res.json(interaction);
  } catch (err) {
    next(err);
  }
});

// Submit reflection (Screen 6: post-interaction)
router.post('/:id/reflect', (req, res, next) => {
  try {
    const { student_id, would_do_again, was_useful, felt_comfortable, same_group_preferred } = req.body;

    if (!student_id) return res.status(400).json({ error: 'student_id is required' });

    const db = getDb();
    const reflectionId = `ref-${randomUUID().slice(0, 8)}`;

    db.prepare(`
      INSERT INTO reflections (id, interaction_id, student_id, would_do_again, was_useful, felt_comfortable, same_group_preferred)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      reflectionId,
      req.params.id,
      student_id,
      would_do_again ? 1 : 0,
      was_useful ? 1 : 0,
      felt_comfortable ? 1 : 0,
      same_group_preferred ? 1 : 0
    );

    // Mark interaction completed
    db.prepare('UPDATE interactions SET status = \'completed\' WHERE id = ?').run(req.params.id);

    // If positive reflection, auto-create anchor if none exists
    if (would_do_again && was_useful && felt_comfortable) {
      const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(req.params.id);
      if (interaction && !interaction.anchor_id) {
        const participants = JSON.parse(interaction.participants || '[]');
        if (participants.length >= 2) {
          const anchorId = `anc-${randomUUID().slice(0, 8)}`;
          db.prepare(`
            INSERT INTO anchors (id, anchor_type, purpose_type, anchor_health_state, first_interaction_at)
            VALUES (?, ?, ?, 'forming', datetime('now'))
          `).run(anchorId, participants.length <= 2 ? 'pair' : 'triad', interaction.purpose || 'recap');

          for (const pid of participants) {
            db.prepare('INSERT OR IGNORE INTO anchor_participants (anchor_id, student_id) VALUES (?, ?)').run(anchorId, pid);
          }

          db.prepare('UPDATE interactions SET anchor_id = ? WHERE id = ?').run(anchorId, req.params.id);
        }
      }
    }

    res.status(201).json({
      id: reflectionId,
      message: would_do_again
        ? 'Great. We will set up your next one automatically.'
        : 'Got it. We will find a better fit next time.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
