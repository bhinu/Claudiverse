import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    cohort_type: '',
    anchor_preference: '',
    format_preference: '',
    comfort_filters: {}
  });

  const questions = [
    {
      label: "What's your name?",
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
      label: 'Do you prefer one person or a small group?',
      type: 'chips',
      field: 'format_preference',
      options: [
        { value: 'pair', label: 'One person' },
        { value: 'small_group', label: 'Tiny group (2 to 3)' }
      ]
    },
    {
      label: 'Any preferences? Pick what matters.',
      type: 'multi_chips',
      field: 'comfort_filters',
      options: [
        { value: 'also_new', label: 'Also new here' },
        { value: 'transfer_student', label: 'Transfer student' },
        { value: 'commuter_friendly', label: 'Commuter friendly' },
        { value: 'international_friendly', label: 'International friendly' },
        { value: 'same_course', label: 'Same course focus' }
      ]
    }
  ];

  const currentQ = questions[step];
  const isLast = step === questions.length - 1;
  const canProceed = currentQ.type === 'text' ? form[currentQ.field]?.trim() : currentQ.type === 'multi_chips' ? true : form[currentQ.field];

  async function handleNext() {
    if (isLast) {
      setLoading(true);
      try {
        const student = await api.onboard(form);
        localStorage.setItem('anchor_student_id', student.id);
        localStorage.setItem('anchor_student_name', student.name);
        navigate('/readiness', { state: { studentId: student.id } });
      } catch (err) {
        console.error(err);
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

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Setting things up for you</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '48px' }}>
        <h1>Let's make your first weeks feel easier.</h1>
        <p>We help you find one useful recurring connection tied to your real week.</p>
      </div>

      {/* Progress */}
      <div className="progress-bar" style={{ marginBottom: '32px' }}>
        <div className="progress-fill" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
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
              onKeyDown={e => e.key === 'Enter' && canProceed && handleNext()}
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
        </div>
      </div>

      {/* Actions */}
      <div className="btn-group vertical" style={{ marginTop: '24px' }}>
        <button
          id="onboard-next"
          className="btn btn-primary btn-block"
          onClick={handleNext}
          disabled={!canProceed}
        >
          {isLast ? 'Find my anchor' : 'Continue'}
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
