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
  const [closerLoading, setCloserLoading] = useState(false);

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

  async function handleCloserSpot() {
    if (!suggestion?.suggestion?.id) return;
    setCloserLoading(true);
    try {
      const result = await api.requestCloserSpot(suggestion.suggestion.id);
      setSuggestion(prev => ({
        ...prev,
        suggestion: { ...prev.suggestion, location: result.location },
        placement: {
          ...prev.placement,
          recommended_location: result.location,
          fit_reason: `Switched to ${result.location} for a shorter walk.`,
          fallback_location: null
        }
      }));
    } catch (err) {
      setError(err.message);
    }
    setCloserLoading(false);
  }

  async function handleDecline(reason) {
    if (!suggestion?.suggestion?.id) return;
    await api.declineSuggestion(suggestion.suggestion.id, reason);
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
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => window.location.reload()} style={{ marginTop: '16px' }}>
          Try again
        </button>
      </div>
    );
  }

  // Clarification needed from placement engine
  if (suggestion?.clarification_needed) {
    return (
      <div className="animate-in">
        <div className="page-header" style={{ marginTop: '32px' }}>
          <p className="text-accent" style={{ fontWeight: 500, marginBottom: '8px' }}>Quick question</p>
          <h1>We need one detail to find the best spot.</h1>
        </div>
        <div className="card card-accent">
          <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>
            {suggestion.clarification_prompt || suggestion.message}
          </p>
        </div>
        <button className="btn btn-secondary btn-block" onClick={() => navigate('/support')} style={{ marginTop: '16px' }}>
          Skip for now
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
  const placement = suggestion.placement;
  const sug = suggestion.suggestion;

  // Derive walking time for current student
  const myWalk = placement?.walk_minutes_by_participant?.[studentId];
  const myLatenessRisk = placement?.lateness_risk_by_participant?.[studentId];

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <p className="text-accent" style={{ fontWeight: 500, marginBottom: '8px' }}>Your easiest anchor this week</p>
        <h1>{inv?.title || 'A connection for your routine'}</h1>
      </div>

      {/* Main invitation card */}
      <div className="card card-accent animate-slide-up">
        <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>
          {inv?.body}
        </p>

        {match?.shared_context && (
          <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {match.shared_context}
          </p>
        )}
      </div>

      {/* Placement card — location + walking time + time fit */}
      <div className="card animate-in stagger-1" style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>📍</span>
          <div>
            <div className="card-label">Where</div>
            <div className="card-value">{sug.location || placement?.recommended_location}</div>
          </div>
        </div>

        {/* Walking time badge */}
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

        {/* Time fit reassurance */}
        {placement?.time_fit_message && (
          <div className="placement-detail">
            <span className="placement-icon">◷</span>
            <span className="placement-text">{placement.time_fit_message}</span>
          </div>
        )}

        {/* Route type badge */}
        {placement?.route_type && placement.route_type !== 'unknown' && (
          <div style={{ marginTop: '8px' }}>
            <span className={`badge badge-route-${placement.route_type}`}>
              {formatRouteType(placement.route_type)}
            </span>
          </div>
        )}
      </div>

      {/* Match reasoning */}
      {match?.why_this_match && (
        <div className="card animate-in stagger-2" style={{ marginTop: '12px' }}>
          <div style={{ padding: '8px 0' }}>
            {match.why_this_match.map((reason, i) => (
              <p key={i} style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: i > 0 ? '4px' : 0 }}>{reason}</p>
            ))}
          </div>
        </div>
      )}

      {/* Actions — Join, Pick Closer Spot, Another Time, Not This Week */}
      <div className="btn-group vertical" style={{ marginTop: '24px' }}>
        <button
          id="action-join"
          className="btn btn-primary btn-block"
          onClick={handleAccept}
          disabled={actionLoading}
        >
          {actionLoading ? 'Setting it up...' : (inv?.cta_primary || "I'm in")}
        </button>

        {placement?.fallback_location && (
          <button
            id="action-closer-spot"
            className="btn btn-secondary btn-block"
            onClick={handleCloserSpot}
            disabled={closerLoading}
          >
            {closerLoading ? 'Finding closer spot...' : 'Pick closer spot'}
          </button>
        )}

        <button
          id="action-reschedule"
          className="btn btn-secondary btn-block"
          onClick={() => navigate('/action', { state: { studentId } })}
        >
          Another time
        </button>

        <button
          className="btn btn-ghost btn-block"
          onClick={() => handleDecline('not_this_week')}
        >
          Not this week
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
