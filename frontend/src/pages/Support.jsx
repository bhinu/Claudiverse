import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Support() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('anchor_student_id');
  const studentName = localStorage.getItem('anchor_student_name');
  const [escalation, setEscalation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    api.getEscalation(studentId)
      .then(data => {
        setEscalation(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [studentId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Action handlers
  function handleAction(type) {
    switch (type) {
      case 'class_change':
        navigate('/onboarding');
        break;
      case 'format_change':
        navigate('/onboarding');
        break;
      case 'time_change':
        navigate('/action', { state: { studentId } });
        break;
      case 'routine_change':
        navigate('/onboarding');
        break;
      case 'human_support':
        // In production: open university support chat or redirect
        break;
      default:
        navigate('/');
    }
  }

  // Smart escalation view (when escalation engine returns data)
  if (escalation?.escalation_needed) {
    return (
      <div className="animate-in">
        <div className="page-header" style={{ marginTop: '32px' }}>
          <p className="text-accent" style={{ fontWeight: 500, marginBottom: '8px' }}>Let us find a better fit</p>
          <h1>We can try something different.</h1>
        </div>

        <div className="card card-accent animate-in stagger-1">
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
            {escalation.message}
          </p>
        </div>

        <div className="btn-group vertical" style={{ marginTop: '24px' }}>
          {escalation.actions.map((action, i) => (
            <button
              key={action.type}
              id={`support-action-${action.type}`}
              className={`btn ${i === 0 ? 'btn-primary' : 'btn-secondary'} btn-block animate-in stagger-${i + 2}`}
              onClick={() => handleAction(action.type)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default fallback view (no escalation data or no escalation needed)
  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <p className="text-muted" style={{ marginBottom: '4px' }}>Support</p>
        <h1>Need a different option?</h1>
        <p style={{ marginTop: '8px' }}>
          If the suggestions so far have not been the right fit, you can adjust what the system looks for.
        </p>
      </div>

      <div className="btn-group vertical" style={{ marginTop: '24px' }}>
        <button
          id="support-different-class"
          className="btn btn-primary btn-block animate-in stagger-1"
          onClick={() => navigate('/onboarding')}
        >
          Try a different class
        </button>

        <button
          id="support-different-time"
          className="btn btn-secondary btn-block animate-in stagger-2"
          onClick={() => navigate('/action', { state: { studentId } })}
        >
          Try a different time
        </button>

        <button
          id="support-pair"
          className="btn btn-secondary btn-block animate-in stagger-3"
          onClick={() => navigate('/onboarding')}
        >
          Switch to one person or a small group
        </button>

        <button
          id="support-home"
          className="btn btn-ghost btn-block animate-in stagger-4"
          onClick={() => navigate('/')}
        >
          Go home
        </button>
      </div>
    </div>
  );
}
