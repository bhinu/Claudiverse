import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

// Available courses on campus (matches seed data)
const CAMPUS_COURSES = [
  { code: 'PSYCH 202', name: 'Intro Psychology II', building: 'Psych Hall', days: ['Tue', 'Thu'], time: '14:00', endTime: '15:15' },
  { code: 'ECON 101', name: 'Principles of Economics', building: 'Econ Building', days: ['Mon', 'Wed', 'Fri'], time: '10:00', endTime: '10:50' },
  { code: 'ENGL 110', name: 'College Writing', building: 'Liberal Arts', days: ['Mon', 'Wed'], time: '13:00', endTime: '14:15' },
  { code: 'MATH 151', name: 'Calculus I', building: 'Science Hall', days: ['Mon', 'Wed', 'Fri'], time: '09:00', endTime: '09:50' },
  { code: 'CS 110', name: 'Intro Computer Science', building: 'Tech Center', days: ['Tue', 'Thu'], time: '11:00', endTime: '12:15' },
  { code: 'BIO 152', name: 'General Biology II', building: 'Science Hall', days: ['Tue', 'Thu'], time: '09:30', endTime: '10:45' },
  { code: 'ART 120', name: 'Intro to Visual Arts', building: 'Fine Arts', days: ['Wed', 'Fri'], time: '14:00', endTime: '15:15' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    cohort_type: '',
    anchor_preference: '',
    format_preference: '',
    comfort_filters: {},
    selected_courses: [],
    anchor_moment: ''
  });

  const questions = [
    {
      label: "What is your name?",
      type: 'text',
      field: 'name',
      placeholder: 'Your first name'
    },
    {
      label: 'Are you new here, a transfer, or returning?',
      type: 'chips',
      field: 'cohort_type',
      options: [
        { value: 'new', label: 'New student' },
        { value: 'transfer', label: 'Transfer' },
        { value: 'returning', label: 'Returning' }
      ]
    },
    {
      label: 'What kind of anchor would help most?',
      type: 'chips',
      field: 'anchor_preference',
      options: [
        { value: 'study_anchor', label: 'Class or study anchor' },
        { value: 'campus_routine', label: 'Campus routine anchor' },
        { value: 'both', label: 'Both' }
      ]
    },
    {
      label: 'Prefer one person or a small group?',
      type: 'chips',
      field: 'format_preference',
      options: [
        { value: 'pair', label: 'One person' },
        { value: 'small_group', label: 'Tiny group (2 to 3)' }
      ]
    },
    {
      label: 'Any comfort preferences?',
      subtitle: 'Optional. Pick what matters or skip.',
      type: 'multi_chips',
      field: 'comfort_filters',
      options: [
        { value: 'also_new', label: 'Also new here' },
        { value: 'transfer_student', label: 'Transfer student' },
        { value: 'commuter_friendly', label: 'Commuter friendly' },
        { value: 'international_friendly', label: 'International friendly' },
        { value: 'same_course', label: 'Same course focus' }
      ]
    },
    {
      label: 'Which classes are you taking?',
      subtitle: 'Pick at least one. This is how we find who shares your routine.',
      type: 'course_select',
      field: 'selected_courses'
    },
    {
      label: 'When is easiest for you?',
      subtitle: 'This tells us which moment in your week to use.',
      type: 'chips',
      field: 'anchor_moment',
      options: [
        { value: 'after_class', label: 'Right after class' },
        { value: 'study_gap', label: 'Study gap between classes' },
        { value: 'before_class', label: 'Before class starts' }
      ]
    }
  ];

  const currentQ = questions[step];
  const isLast = step === questions.length - 1;
  const totalSteps = questions.length;

  function canProceed() {
    if (currentQ.type === 'text') return form[currentQ.field]?.trim();
    if (currentQ.type === 'multi_chips') return true;
    if (currentQ.type === 'course_select') return form.selected_courses.length >= 1;
    return form[currentQ.field];
  }

  async function handleNext() {
    if (isLast) {
      setLoading(true);
      setLoadingStep(0);

      try {
        // Build course data from selected courses
        const selectedCourseData = form.selected_courses.map(code => {
          const c = CAMPUS_COURSES.find(cc => cc.code === code);
          return {
            course: c.code,
            section: 'A',
            days: c.days,
            time: c.time,
            endTime: c.endTime,
            building: c.building
          };
        });

        // Build schedule blocks
        const dayMap = {};
        for (const c of selectedCourseData) {
          for (const day of c.days) {
            if (!dayMap[day]) dayMap[day] = [];
            dayMap[day].push({ start: c.time, end: c.endTime, type: 'class' });
          }
        }
        const scheduleBlocks = Object.entries(dayMap).map(([day, blocks]) => ({
          day,
          blocks: blocks.sort((a, b) => a.start.localeCompare(b.start))
        }));

        // Animate loading steps
        const stepTimer1 = setTimeout(() => setLoadingStep(1), 1200);
        const stepTimer2 = setTimeout(() => setLoadingStep(2), 2400);

        // Create the student
        const student = await api.onboard({
          ...form,
          comfort_filters: form.comfort_filters
        });

        // Now enrich with real course data
        await api.updateSchedule(student.id, {
          academic_contexts: selectedCourseData,
          schedule_blocks: scheduleBlocks,
          location_patterns: [...new Set(selectedCourseData.map(c => c.building))]
        });

        localStorage.setItem('anchor_student_id', student.id);
        localStorage.setItem('anchor_student_name', student.name);

        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        setLoadingStep(3);

        // Short pause to show completion, then navigate
        setTimeout(() => {
          navigate('/action', { state: { studentId: student.id } });
        }, 800);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    } else {
      setStep(s => s + 1);
    }
  }

  function handleChip(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleMultiChip(field, value) {
    setForm(f => ({
      ...f,
      [field]: { ...f[field], [value]: !f[field]?.[value] }
    }));
  }

  function toggleCourse(code) {
    setForm(f => {
      const has = f.selected_courses.includes(code);
      return {
        ...f,
        selected_courses: has
          ? f.selected_courses.filter(c => c !== code)
          : [...f.selected_courses, code]
      };
    });
  }

  // Loading state with animated progress steps
  if (loading) {
    const loadingSteps = [
      'Checking your class and time overlap',
      'Finding the closest low-friction meetup',
      'Picking the best first connection'
    ];

    return (
      <div className="loading animate-in">
        <div className="loading-spinner" />
        <h3 style={{ marginTop: '16px', marginBottom: '24px' }}>Finding your easiest anchor</h3>
        <div style={{ textAlign: 'left', maxWidth: '300px' }}>
          {loadingSteps.map((text, i) => (
            <div key={i} className="placement-detail" style={{
              opacity: loadingStep >= i ? 1 : 0.3,
              transition: 'opacity 0.5s ease'
            }}>
              <span className="placement-icon">{loadingStep > i ? '✓' : loadingStep === i ? '◌' : '○'}</span>
              <span className="placement-text" style={{
                color: loadingStep > i ? 'var(--accent)' : loadingStep === i ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error fallback
  if (error) {
    return (
      <div className="animate-in" style={{ textAlign: 'center', marginTop: '64px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⚠</div>
        <h3>We need one more thing to find a useful anchor.</h3>
        <p style={{ marginTop: '8px', maxWidth: '280px', margin: '8px auto 24px' }}>
          {error || 'Could not generate a result with the current data.'}
        </p>
        <div className="btn-group vertical" style={{ maxWidth: '300px', margin: '0 auto' }}>
          <button className="btn btn-primary btn-block" onClick={() => { setError(null); setStep(5); }}>
            Pick a different class
          </button>
          <button className="btn btn-secondary btn-block" onClick={() => { setError(null); setLoading(false); }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Button label depends on step
  function getButtonLabel() {
    if (isLast) return 'See my easiest option';
    if (currentQ.type === 'multi_chips') return 'Continue';
    if (step === 5) return 'Continue';
    return 'Continue';
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '48px' }}>
        <h1>{step <= 4
          ? "Let us make your first weeks feel easier."
          : step === 5
          ? "Which classes are you in?"
          : "Almost there."
        }</h1>
        <p>{step <= 4
          ? "We help you find one useful recurring connection tied to your real week."
          : step === 5
          ? currentQ.subtitle
          : currentQ.subtitle
        }</p>
      </div>

      {/* Progress */}
      <div className="progress-bar" style={{ marginBottom: '32px' }}>
        <div className="progress-fill" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="animate-in" key={step}>
        <div className="form-group">
          <label className="form-label">{currentQ.label}</label>

          {currentQ.type === 'text' && (
            <input
              id={`onboard-${currentQ.field}`}
              className="form-input"
              type="text"
              placeholder={currentQ.placeholder}
              value={form[currentQ.field] || ''}
              onChange={e => setForm(f => ({ ...f, [currentQ.field]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && canProceed() && handleNext()}
              autoFocus
            />
          )}

          {currentQ.type === 'chips' && (
            <div className="chip-group">
              {currentQ.options.map(opt => (
                <button
                  key={opt.value}
                  id={`onboard-chip-${opt.value}`}
                  className={`chip ${form[currentQ.field] === opt.value ? 'active' : ''}`}
                  onClick={() => handleChip(currentQ.field, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {currentQ.type === 'multi_chips' && (
            <div className="chip-group">
              {currentQ.options.map(opt => (
                <button
                  key={opt.value}
                  id={`onboard-filter-${opt.value}`}
                  className={`chip ${form[currentQ.field]?.[opt.value] ? 'active' : ''}`}
                  onClick={() => handleMultiChip(currentQ.field, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {currentQ.type === 'course_select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {CAMPUS_COURSES.map(course => {
                const selected = form.selected_courses.includes(course.code);
                return (
                  <button
                    key={course.code}
                    className={`tap-option ${selected ? 'selected-yes' : ''}`}
                    onClick={() => toggleCourse(course.code)}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{course.code}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {course.days.join(', ')} · {course.time} · {course.building}
                      </div>
                    </div>
                    <div className="tap-indicator">{selected ? '✓' : ''}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="btn-group vertical" style={{ marginTop: '24px' }}>
        <button
          id="onboard-next"
          className="btn btn-primary btn-block"
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {getButtonLabel()}
        </button>

        {step > 0 && (
          <button className="btn btn-ghost btn-block" onClick={() => setStep(s => s - 1)}>
            Back
          </button>
        )}

        {currentQ.type === 'multi_chips' && (
          <button className="btn btn-ghost btn-block" onClick={handleNext}>
            Skip this
          </button>
        )}
      </div>
    </div>
  );
}
