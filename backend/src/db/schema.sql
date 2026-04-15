-- Anchor OS Database Schema

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  cohort_type TEXT NOT NULL DEFAULT 'new',          -- new, transfer, returning
  transfer_status INTEGER DEFAULT 0,
  first_term_status INTEGER DEFAULT 1,
  commuter_flag INTEGER DEFAULT 0,
  academic_contexts TEXT DEFAULT '[]',               -- JSON array of courses
  schedule_blocks TEXT DEFAULT '[]',                 -- JSON array of schedule entries
  location_patterns TEXT DEFAULT '[]',               -- JSON array of campus locations
  comfort_preferences TEXT DEFAULT '{}',             -- JSON object
  interaction_preferences TEXT DEFAULT '{}',         -- JSON object
  anchor_risk_state TEXT DEFAULT 'unknown',          -- unknown, low, medium, high
  support_flags TEXT DEFAULT '[]',                   -- JSON array
  onboarded_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS anchors (
  id TEXT PRIMARY KEY,
  anchor_type TEXT NOT NULL,                         -- pair, triad, micro_circle
  routine_context TEXT DEFAULT '{}',                 -- JSON object
  purpose_type TEXT NOT NULL,                        -- recap, study, walk, coffee
  recurrence_pattern TEXT DEFAULT 'weekly',          -- weekly, biweekly
  anchor_health_state TEXT DEFAULT 'weak',           -- weak, forming, stable, stalled
  first_interaction_at TEXT,
  next_interaction_at TEXT,
  last_interaction_outcome TEXT DEFAULT '{}',        -- JSON object
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS anchor_participants (
  anchor_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  joined_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (anchor_id, student_id),
  FOREIGN KEY (anchor_id) REFERENCES anchors(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  routine_hook TEXT DEFAULT '{}',                    -- JSON object
  participants TEXT DEFAULT '[]',                    -- JSON array of student IDs
  purpose TEXT NOT NULL,
  location TEXT,
  duration_minutes INTEGER DEFAULT 10,
  invitation_title TEXT,
  invitation_body TEXT,
  cta_primary TEXT DEFAULT 'Join',
  cta_secondary TEXT DEFAULT 'Pick another time',
  continuity_plan TEXT DEFAULT '{}',                 -- JSON object
  placement_data TEXT DEFAULT '{}',                  -- JSON: placement engine output
  confidence_score REAL DEFAULT 0.0,
  relevance_reasons TEXT DEFAULT '[]',               -- JSON array
  status TEXT DEFAULT 'pending',                     -- pending, accepted, declined, rescheduled
  decline_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  suggestion_id TEXT,
  anchor_id TEXT,
  participants TEXT DEFAULT '[]',                    -- JSON array of student IDs
  scheduled_at TEXT NOT NULL,
  location TEXT,
  duration_minutes INTEGER DEFAULT 10,
  purpose TEXT,
  icebreaker_prompt TEXT,
  arrival_instructions TEXT,
  status TEXT DEFAULT 'upcoming',                    -- upcoming, in_progress, completed, missed
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (suggestion_id) REFERENCES suggestions(id),
  FOREIGN KEY (anchor_id) REFERENCES anchors(id)
);

CREATE TABLE IF NOT EXISTS reflections (
  id TEXT PRIMARY KEY,
  interaction_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  would_do_again INTEGER,                            -- 1 = yes, 0 = no
  was_useful INTEGER,                                -- 1 = yes, 0 = no
  felt_comfortable INTEGER,                          -- 1 = yes, 0 = no
  same_group_preferred INTEGER,                      -- 1 = same, 0 = different
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (interaction_id) REFERENCES interactions(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS anchor_health_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anchor_id TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  reason TEXT,
  logged_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (anchor_id) REFERENCES anchors(id)
);
