import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function InteractionDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const interactionId = location.state?.interactionId;
  const studentId = location.state?.studentId || localStorage.getItem('anchor_student_id');
  const [interaction, setInteraction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!interactionId) {
      navigate('/');
      return;
    }

    api.getInteraction(interactionId)
      .then(data => {
        setInteraction(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [interactionId, navigate]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Loading your interaction</p>
      </div>
    );
  }

  if (!interaction) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠</div>
        <h3>Interaction not found</h3>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <p className="text-accent" style={{ fontWeight: 500, marginBottom: '8px' }}>Your anchor is set</p>
        <h1>Here's everything you need.</h1>
      </div>

      <div className="card card-accent animate-in stagger-1">
        <div className="card-label">When</div>
        <div className="card-value">{interaction.scheduled_at}</div>
      </div>

      <div className="card animate-in stagger-2">
        <div className="card-label">Where</div>
        <div className="card-value">{interaction.location || 'Will be shared soon'}</div>
      </div>

      <div className="card animate-in stagger-3">
        <div className="card-label">How long</div>
        <div className="card-value">{interaction.duration_minutes} minutes</div>
      </div>

      <div className="card animate-in stagger-4">
        <div className="card-label">Purpose</div>
        <div className="card-value" style={{ textTransform: 'capitalize' }}>{interaction.purpose || 'Recap and connect'}</div>
      </div>

      {interaction.participants && interaction.participants.length > 0 && (
        <div className="card animate-in">
          <div className="card-label">Who you'll meet</div>
          {interaction.participants.map((p, i) => (
            <p key={i} style={{ marginTop: i > 0 ? '4px' : 0, color: 'var(--text-primary)' }}>
              {p.name} <span className="text-muted">({p.cohort_type})</span>
            </p>
          ))}
        </div>
      )}

      <div className="card animate-in" style={{ borderColor: 'var(--amber)', borderWidth: '1px' }}>
        <div className="card-label" style={{ color: 'var(--amber)' }}>When you arrive</div>
        <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
          {interaction.arrival_instructions || 'Say your name and answer the first prompt on screen.'}
        </p>
      </div>

      {interaction.icebreaker_prompt && (
        <div className="card card-glass animate-in" style={{ textAlign: 'center', marginTop: '16px' }}>
          <div className="card-label">Icebreaker prompt</div>
          <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500, fontStyle: 'italic' }}>
            "{interaction.icebreaker_prompt}"
          </p>
        </div>
      )}

      <div className="btn-group vertical" style={{ marginTop: '24px' }}>
        <button
          id="interaction-start"
          className="btn btn-primary btn-block"
          onClick={() => navigate('/live', { state: { interactionId, studentId } })}
        >
          Start interaction
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => navigate('/')}>
          I'll come back later
        </button>
      </div>
    </div>
  );
}
