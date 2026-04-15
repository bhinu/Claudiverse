import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Reflection() {
  const navigate = useNavigate();
  const location = useLocation();
  const interactionId = location.state?.interactionId;
  const studentId = location.state?.studentId || localStorage.getItem('anchor_student_id');
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const questions = [
    { key: 'would_do_again', label: 'Would you do this again?' },
    { key: 'was_useful', label: 'Was this useful?' },
    { key: 'felt_comfortable', label: 'Did this feel comfortable enough?' },
    { key: 'same_group_preferred', label: 'Want the same group next time?' }
  ];

  const allAnswered = questions.every(q => answers[q.key] !== undefined);

  async function handleSubmit() {
    if (!interactionId) return;
    setLoading(true);
    try {
      await api.submitReflection(interactionId, {
        student_id: studentId,
        ...answers
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  if (submitted) {
    const allPositive = answers.would_do_again && answers.was_useful && answers.felt_comfortable;
    return (
      <div className="animate-in" style={{ textAlign: 'center', marginTop: '64px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
          {allPositive ? '⚓' : '◎'}
        </div>
        <h1>{allPositive ? "You\u2019ve started an anchor." : "Noted. We will adjust."}</h1>
        <p style={{ marginTop: '12px', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
          {allPositive
            ? 'This now lives in your week. Small repeated contact is how campus starts feeling familiar.'
            : "We will find a better fit for you. No pressure."
          }
        </p>

        {allPositive && answers.same_group_preferred && (
          <div className="card card-accent animate-in stagger-1" style={{ marginTop: '24px', textAlign: 'left' }}>
            <div className="card-label">Coming up next</div>
            <div className="card-value">Same time next week. We will remind you.</div>
          </div>
        )}

        <div className="btn-group vertical" style={{ marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go home
          </button>
          {allPositive && (
            <button className="btn btn-secondary" onClick={() => navigate('/anchors')}>
              See my anchors
            </button>
          )}
          {!allPositive && (
            <button className="btn btn-secondary" onClick={() => navigate('/support')}>
              Try something different
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <p className="text-accent" style={{ fontWeight: 500, marginBottom: '8px' }}>Quick reflection</p>
        <h1>How was it?</h1>
        <p>Four taps. Takes 20 seconds.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {questions.map((q, i) => (
          <div key={q.key} className={`animate-in stagger-${i + 1}`}>
            <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {q.label}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                id={`reflect-${q.key}-yes`}
                className={`tap-option ${answers[q.key] === true ? 'selected-yes' : ''}`}
                onClick={() => setAnswers(a => ({ ...a, [q.key]: true }))}
                style={{ flex: 1 }}
              >
                Yes
                <span className="tap-indicator">{answers[q.key] === true ? '✓' : ''}</span>
              </button>
              <button
                id={`reflect-${q.key}-no`}
                className={`tap-option ${answers[q.key] === false ? 'selected-no' : ''}`}
                onClick={() => setAnswers(a => ({ ...a, [q.key]: false }))}
                style={{ flex: 1 }}
              >
                Not really
                <span className="tap-indicator">{answers[q.key] === false ? '✓' : ''}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        id="reflect-submit"
        className="btn btn-primary btn-block"
        onClick={handleSubmit}
        disabled={!allAnswered || loading}
        style={{ marginTop: '24px' }}
      >
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </div>
  );
}
