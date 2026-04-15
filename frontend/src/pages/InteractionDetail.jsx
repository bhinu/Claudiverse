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

  const placement = interaction.placement_data;
  const myWalk = placement?.walk_minutes_by_participant?.[studentId];

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <p className="text-accent" style={{ fontWeight: 500, marginBottom: '8px' }}>Your anchor is set</p>
        <h1>Here is everything you need.</h1>
      </div>

      <div className="card card-accent animate-in stagger-1">
        <div className="card-label">When</div>
        <div className="card-value">{interaction.scheduled_at}</div>
      </div>

      {/* Location card with placement details */}
      <div className="card animate-in stagger-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>📍</span>
          <div>
            <div className="card-label">Where</div>
            <div className="card-value">{interaction.location || 'Will be shared soon'}</div>
          </div>
        </div>

        {/* Walking time */}
        {myWalk !== undefined && (
          <div className="placement-detail">
            <span className="placement-icon">🚶</span>
            <span className="placement-text">
              {myWalk === 0
                ? 'Same building as your class'
                : `${myWalk} minute${myWalk !== 1 ? 's' : ''} from your class`
              }
            </span>
          </div>
        )}

        {/* Fit reason */}
        {placement?.fit_reason && (
          <div className="placement-detail">
            <span className="placement-icon">✓</span>
            <span className="placement-text">{placement.fit_reason}</span>
          </div>
        )}

        {/* Time fit */}
        {placement?.time_fit_message && (
          <div className="placement-detail">
            <span className="placement-icon">◷</span>
            <span className="placement-text">{placement.time_fit_message}</span>
          </div>
        )}

        {/* Route type */}
        {placement?.route_type && placement.route_type !== 'unknown' && (
          <div style={{ marginTop: '6px' }}>
            <span className={`badge badge-route-${placement.route_type}`}>
              {formatRouteType(placement.route_type)}
            </span>
          </div>
        )}
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
          <div className="card-label">Who you will meet</div>
          {interaction.participants.map((p, i) => (
            <p key={i} style={{ marginTop: i > 0 ? '4px' : 0, color: 'var(--text-primary)' }}>
              {p.name} <span className="text-muted">({p.cohort_type})</span>
            </p>
          ))}
        </div>
      )}

      {/* Arrival instructions — uses placement arrival_note */}
      <div className="card animate-in" style={{ borderColor: 'var(--amber)', borderWidth: '1px' }}>
        <div className="card-label" style={{ color: 'var(--amber)' }}>When you arrive</div>
        <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
          {placement?.arrival_note || interaction.arrival_instructions || 'Say your name and answer the first prompt on screen.'}
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
          I will come back later
        </button>
      </div>
    </div>
  );
}

function formatRouteType(routeType) {
  const labels = {
    same_building: 'Same building',
    same_cluster: 'Same area',
    on_path: 'On your path',
    short_detour: 'Short detour'
  };
  return labels[routeType] || routeType;
}
