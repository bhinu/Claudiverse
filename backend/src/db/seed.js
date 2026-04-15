import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = join(__dirname, '..', '..', 'data', 'anchor.db');

// Ensure data directory exists
import { mkdirSync } from 'fs';
mkdirSync(join(__dirname, '..', '..', 'data'), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Run schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Seed students
const students = [
  {
    id: 's-001',
    name: 'Maya Torres',
    email: 'mtorres@university.edu',
    cohort_type: 'transfer',
    transfer_status: 1,
    first_term_status: 1,
    commuter_flag: 0,
    academic_contexts: JSON.stringify([
      { course: 'PSYCH 202', section: 'A', days: ['Tue', 'Thu'], time: '14:00', endTime: '15:15', building: 'Psych Hall' },
      { course: 'ECON 101', section: 'B', days: ['Mon', 'Wed', 'Fri'], time: '10:00', endTime: '10:50', building: 'Econ Building' },
      { course: 'ENGL 110', section: 'C', days: ['Mon', 'Wed'], time: '13:00', endTime: '14:15', building: 'Liberal Arts' }
    ]),
    schedule_blocks: JSON.stringify([
      { day: 'Mon', blocks: [{ start: '10:00', end: '10:50', type: 'class' }, { start: '13:00', end: '14:15', type: 'class' }] },
      { day: 'Tue', blocks: [{ start: '14:00', end: '15:15', type: 'class' }] },
      { day: 'Wed', blocks: [{ start: '10:00', end: '10:50', type: 'class' }, { start: '13:00', end: '14:15', type: 'class' }] },
      { day: 'Thu', blocks: [{ start: '14:00', end: '15:15', type: 'class' }] },
      { day: 'Fri', blocks: [{ start: '10:00', end: '10:50', type: 'class' }] }
    ]),
    location_patterns: JSON.stringify(['Library East', 'Student Commons', 'Psych Hall Lobby']),
    comfort_preferences: JSON.stringify({ also_new: true, transfer_student: true, commuter_friendly: false, international_friendly: false, same_course: true }),
    interaction_preferences: JSON.stringify({ format: 'pair', duration: '10-15', type: 'study_anchor' }),
    anchor_risk_state: 'high'
  },
  {
    id: 's-002',
    name: 'James Chen',
    email: 'jchen@university.edu',
    cohort_type: 'new',
    transfer_status: 0,
    first_term_status: 1,
    commuter_flag: 1,
    academic_contexts: JSON.stringify([
      { course: 'PSYCH 202', section: 'A', days: ['Tue', 'Thu'], time: '14:00', endTime: '15:15', building: 'Psych Hall' },
      { course: 'MATH 151', section: 'A', days: ['Mon', 'Wed', 'Fri'], time: '09:00', endTime: '09:50', building: 'Science Hall' },
      { course: 'CS 110', section: 'B', days: ['Tue', 'Thu'], time: '11:00', endTime: '12:15', building: 'Tech Center' }
    ]),
    schedule_blocks: JSON.stringify([
      { day: 'Mon', blocks: [{ start: '09:00', end: '09:50', type: 'class' }] },
      { day: 'Tue', blocks: [{ start: '11:00', end: '12:15', type: 'class' }, { start: '14:00', end: '15:15', type: 'class' }] },
      { day: 'Wed', blocks: [{ start: '09:00', end: '09:50', type: 'class' }] },
      { day: 'Thu', blocks: [{ start: '11:00', end: '12:15', type: 'class' }, { start: '14:00', end: '15:15', type: 'class' }] },
      { day: 'Fri', blocks: [{ start: '09:00', end: '09:50', type: 'class' }] }
    ]),
    location_patterns: JSON.stringify(['Tech Center Café', 'Library West']),
    comfort_preferences: JSON.stringify({ also_new: true, transfer_student: false, commuter_friendly: true, international_friendly: false, same_course: true }),
    interaction_preferences: JSON.stringify({ format: 'pair', duration: '10-15', type: 'both' }),
    anchor_risk_state: 'high'
  },
  {
    id: 's-003',
    name: 'Priya Sharma',
    email: 'psharma@university.edu',
    cohort_type: 'new',
    transfer_status: 0,
    first_term_status: 1,
    commuter_flag: 0,
    academic_contexts: JSON.stringify([
      { course: 'ECON 101', section: 'B', days: ['Mon', 'Wed', 'Fri'], time: '10:00', endTime: '10:50', building: 'Econ Building' },
      { course: 'BIO 152', section: 'A', days: ['Tue', 'Thu'], time: '09:30', endTime: '10:45', building: 'Science Hall' },
      { course: 'ENGL 110', section: 'C', days: ['Mon', 'Wed'], time: '13:00', endTime: '14:15', building: 'Liberal Arts' }
    ]),
    schedule_blocks: JSON.stringify([
      { day: 'Mon', blocks: [{ start: '10:00', end: '10:50', type: 'class' }, { start: '13:00', end: '14:15', type: 'class' }] },
      { day: 'Tue', blocks: [{ start: '09:30', end: '10:45', type: 'class' }] },
      { day: 'Wed', blocks: [{ start: '10:00', end: '10:50', type: 'class' }, { start: '13:00', end: '14:15', type: 'class' }] },
      { day: 'Thu', blocks: [{ start: '09:30', end: '10:45', type: 'class' }] },
      { day: 'Fri', blocks: [{ start: '10:00', end: '10:50', type: 'class' }] }
    ]),
    location_patterns: JSON.stringify(['Student Commons', 'Library East', 'Econ Building Lobby']),
    comfort_preferences: JSON.stringify({ also_new: true, transfer_student: false, commuter_friendly: false, international_friendly: true, same_course: true }),
    interaction_preferences: JSON.stringify({ format: 'small_group', duration: '10-20', type: 'study_anchor' }),
    anchor_risk_state: 'medium'
  },
  {
    id: 's-004',
    name: 'David Park',
    email: 'dpark@university.edu',
    cohort_type: 'transfer',
    transfer_status: 1,
    first_term_status: 1,
    commuter_flag: 1,
    academic_contexts: JSON.stringify([
      { course: 'PSYCH 202', section: 'A', days: ['Tue', 'Thu'], time: '14:00', endTime: '15:15', building: 'Psych Hall' },
      { course: 'ECON 101', section: 'B', days: ['Mon', 'Wed', 'Fri'], time: '10:00', endTime: '10:50', building: 'Econ Building' }
    ]),
    schedule_blocks: JSON.stringify([
      { day: 'Mon', blocks: [{ start: '10:00', end: '10:50', type: 'class' }] },
      { day: 'Tue', blocks: [{ start: '14:00', end: '15:15', type: 'class' }] },
      { day: 'Wed', blocks: [{ start: '10:00', end: '10:50', type: 'class' }] },
      { day: 'Thu', blocks: [{ start: '14:00', end: '15:15', type: 'class' }] },
      { day: 'Fri', blocks: [{ start: '10:00', end: '10:50', type: 'class' }] }
    ]),
    location_patterns: JSON.stringify(['Parking Lot B', 'Econ Building Lobby', 'Library East']),
    comfort_preferences: JSON.stringify({ also_new: false, transfer_student: true, commuter_friendly: true, international_friendly: false, same_course: true }),
    interaction_preferences: JSON.stringify({ format: 'pair', duration: '10-15', type: 'campus_routine' }),
    anchor_risk_state: 'high'
  },
  {
    id: 's-005',
    name: 'Sofia Rodriguez',
    email: 'srodriguez@university.edu',
    cohort_type: 'new',
    transfer_status: 0,
    first_term_status: 1,
    commuter_flag: 0,
    academic_contexts: JSON.stringify([
      { course: 'MATH 151', section: 'A', days: ['Mon', 'Wed', 'Fri'], time: '09:00', endTime: '09:50', building: 'Science Hall' },
      { course: 'PSYCH 202', section: 'A', days: ['Tue', 'Thu'], time: '14:00', endTime: '15:15', building: 'Psych Hall' },
      { course: 'ART 120', section: 'A', days: ['Wed', 'Fri'], time: '14:00', endTime: '15:15', building: 'Fine Arts' }
    ]),
    schedule_blocks: JSON.stringify([
      { day: 'Mon', blocks: [{ start: '09:00', end: '09:50', type: 'class' }] },
      { day: 'Tue', blocks: [{ start: '14:00', end: '15:15', type: 'class' }] },
      { day: 'Wed', blocks: [{ start: '09:00', end: '09:50', type: 'class' }, { start: '14:00', end: '15:15', type: 'class' }] },
      { day: 'Thu', blocks: [{ start: '14:00', end: '15:15', type: 'class' }] },
      { day: 'Fri', blocks: [{ start: '09:00', end: '09:50', type: 'class' }, { start: '14:00', end: '15:15', type: 'class' }] }
    ]),
    location_patterns: JSON.stringify(['Fine Arts Café', 'Student Commons', 'Psych Hall Lobby']),
    comfort_preferences: JSON.stringify({ also_new: true, transfer_student: false, commuter_friendly: false, international_friendly: false, same_course: true }),
    interaction_preferences: JSON.stringify({ format: 'small_group', duration: '10-20', type: 'both' }),
    anchor_risk_state: 'medium'
  },
  {
    id: 's-006',
    name: 'Amara Okafor',
    email: 'aokafor@university.edu',
    cohort_type: 'new',
    transfer_status: 0,
    first_term_status: 1,
    commuter_flag: 0,
    academic_contexts: JSON.stringify([
      { course: 'BIO 152', section: 'A', days: ['Tue', 'Thu'], time: '09:30', endTime: '10:45', building: 'Science Hall' },
      { course: 'ECON 101', section: 'B', days: ['Mon', 'Wed', 'Fri'], time: '10:00', endTime: '10:50', building: 'Econ Building' },
      { course: 'CS 110', section: 'B', days: ['Tue', 'Thu'], time: '11:00', endTime: '12:15', building: 'Tech Center' }
    ]),
    schedule_blocks: JSON.stringify([
      { day: 'Mon', blocks: [{ start: '10:00', end: '10:50', type: 'class' }] },
      { day: 'Tue', blocks: [{ start: '09:30', end: '10:45', type: 'class' }, { start: '11:00', end: '12:15', type: 'class' }] },
      { day: 'Wed', blocks: [{ start: '10:00', end: '10:50', type: 'class' }] },
      { day: 'Thu', blocks: [{ start: '09:30', end: '10:45', type: 'class' }, { start: '11:00', end: '12:15', type: 'class' }] },
      { day: 'Fri', blocks: [{ start: '10:00', end: '10:50', type: 'class' }] }
    ]),
    location_patterns: JSON.stringify(['Science Hall Atrium', 'Library West', 'Tech Center Café']),
    comfort_preferences: JSON.stringify({ also_new: true, transfer_student: false, commuter_friendly: false, international_friendly: true, same_course: true }),
    interaction_preferences: JSON.stringify({ format: 'pair', duration: '10-15', type: 'study_anchor' }),
    anchor_risk_state: 'medium'
  },
  {
    id: 's-007',
    name: 'Liam Nguyen',
    email: 'lnguyen@university.edu',
    cohort_type: 'transfer',
    transfer_status: 1,
    first_term_status: 1,
    commuter_flag: 0,
    academic_contexts: JSON.stringify([
      { course: 'CS 110', section: 'B', days: ['Tue', 'Thu'], time: '11:00', endTime: '12:15', building: 'Tech Center' },
      { course: 'MATH 151', section: 'A', days: ['Mon', 'Wed', 'Fri'], time: '09:00', endTime: '09:50', building: 'Science Hall' },
      { course: 'ENGL 110', section: 'C', days: ['Mon', 'Wed'], time: '13:00', endTime: '14:15', building: 'Liberal Arts' }
    ]),
    schedule_blocks: JSON.stringify([
      { day: 'Mon', blocks: [{ start: '09:00', end: '09:50', type: 'class' }, { start: '13:00', end: '14:15', type: 'class' }] },
      { day: 'Tue', blocks: [{ start: '11:00', end: '12:15', type: 'class' }] },
      { day: 'Wed', blocks: [{ start: '09:00', end: '09:50', type: 'class' }, { start: '13:00', end: '14:15', type: 'class' }] },
      { day: 'Thu', blocks: [{ start: '11:00', end: '12:15', type: 'class' }] },
      { day: 'Fri', blocks: [{ start: '09:00', end: '09:50', type: 'class' }] }
    ]),
    location_patterns: JSON.stringify(['Tech Center Café', 'Library East', 'Student Commons']),
    comfort_preferences: JSON.stringify({ also_new: false, transfer_student: true, commuter_friendly: false, international_friendly: false, same_course: true }),
    interaction_preferences: JSON.stringify({ format: 'pair', duration: '10-15', type: 'study_anchor' }),
    anchor_risk_state: 'high'
  },
  {
    id: 's-008',
    name: 'Elena Volkov',
    email: 'evolkov@university.edu',
    cohort_type: 'new',
    transfer_status: 0,
    first_term_status: 1,
    commuter_flag: 0,
    academic_contexts: JSON.stringify([
      { course: 'PSYCH 202', section: 'A', days: ['Tue', 'Thu'], time: '14:00', endTime: '15:15', building: 'Psych Hall' },
      { course: 'BIO 152', section: 'A', days: ['Tue', 'Thu'], time: '09:30', endTime: '10:45', building: 'Science Hall' },
      { course: 'MATH 151', section: 'A', days: ['Mon', 'Wed', 'Fri'], time: '09:00', endTime: '09:50', building: 'Science Hall' }
    ]),
    schedule_blocks: JSON.stringify([
      { day: 'Mon', blocks: [{ start: '09:00', end: '09:50', type: 'class' }] },
      { day: 'Tue', blocks: [{ start: '09:30', end: '10:45', type: 'class' }, { start: '14:00', end: '15:15', type: 'class' }] },
      { day: 'Wed', blocks: [{ start: '09:00', end: '09:50', type: 'class' }] },
      { day: 'Thu', blocks: [{ start: '09:30', end: '10:45', type: 'class' }, { start: '14:00', end: '15:15', type: 'class' }] },
      { day: 'Fri', blocks: [{ start: '09:00', end: '09:50', type: 'class' }] }
    ]),
    location_patterns: JSON.stringify(['Science Hall Atrium', 'Psych Hall Lobby', 'Library East']),
    comfort_preferences: JSON.stringify({ also_new: true, transfer_student: false, commuter_friendly: false, international_friendly: true, same_course: true }),
    interaction_preferences: JSON.stringify({ format: 'small_group', duration: '10-20', type: 'both' }),
    anchor_risk_state: 'medium'
  }
];

const insertStudent = db.prepare(`
  INSERT OR REPLACE INTO students (id, name, email, cohort_type, transfer_status, first_term_status, commuter_flag,
    academic_contexts, schedule_blocks, location_patterns, comfort_preferences, interaction_preferences,
    anchor_risk_state, onboarded_at)
  VALUES (@id, @name, @email, @cohort_type, @transfer_status, @first_term_status, @commuter_flag,
    @academic_contexts, @schedule_blocks, @location_patterns, @comfort_preferences, @interaction_preferences,
    @anchor_risk_state, datetime('now'))
`);

const insertMany = db.transaction((items) => {
  for (const item of items) {
    insertStudent.run(item);
  }
});

insertMany(students);

console.log(`Seeded ${students.length} students successfully.`);

// Verify
const count = db.prepare('SELECT COUNT(*) as count FROM students').get();
console.log(`Total students in database: ${count.count}`);

db.close();
