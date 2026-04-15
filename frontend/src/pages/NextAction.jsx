import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function NextAction() {
  const navigate = useNavigate();
  const location = useLocation();
  const studentId = location.state?.studentId || localStorage.getItem('anchor_student_id');
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!studentId) {
      navigate('/onboarding');
      return;
    }

    api.generateSuggestion(studentId)
      .then(data => {
        setSuggestion(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [studentId, navigate]);

  async function handleAccept() {
    if (!suggestion?.suggestion?.id) return;
    setActionLoading(true);
    try {
      const interaction = await api.acceptSuggestion(suggestion.suggestion.id);
      navigate('/interaction', { state: { interactionId: interaction.id, studentId } });
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
    }
  }

  async function handleDecline() {
    if (!suggestion?.suggestion?.id) return;
    await api.declineSuggestion(suggestion.suggestion.id, 'not_this_week');
    navigate('/support');
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Finding your best anchor this week</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠</div>
        <h3>Couldn't generate a suggestion</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => window.location.reload()} style={{ marginTop: '16px' }}>
          Try again
        </button>
      </div>
    );
  }

  if (!suggestion?.suggestion) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◯</div>
        <h3>Still looking</h3>
        <p>{suggestion?.message || 'We are finding the right match for your routine.'}</p>
      </div>
    );
  }

  const inv = suggestion.invitation;
  const match = suggestion.match;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <p className="text-accent" style={{ fontWeight: 500, marginBottom: '8px' }}>Your easiest anchor this week</p>
        <h1>{inv?.title || 'A connection for your routine'}</h1>
      </div>

      <div className="card card-accent animate-slide-up">
        <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>
          {inv?.body}
        </p>

        {match?.shared_context && (
          <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {match.shared_context}
          </p>
        )}

        {match?.why_this_match && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)' }}>
            {match.why_this_match.map((reason, i) => (
              <p key={i} style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: i > 0 ? '4px' : 0 }}>{reason}</p>
            ))}
          </div>
        )}
      </div>

      <div className="btn-group vertical" style={{ marginTop: '24px' }}>
        <button
          id="action-join"
          className="btn btn-primary btn-block"
          onClick={handleAccept}
          disabled={actionLoading}
        >
          {actionLoading ? 'Setting it up...' : (inv?.cta_primary || 'Join')}
        </button>
        <button
          id="action-reschedule"
          className="btn btn-secondary btn-block"
          onClick={() => navigate('/action', { state: { studentId } })}
        >
          {inv?.cta_secondary || 'Pick another time'}
        </button>
        <button
          className="btn btn-ghost btn-block"
          onClick={handleDecline}
        >
          Not this week
        </button>
      </div>
    </div>
  );
}
