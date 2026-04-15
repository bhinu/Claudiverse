import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

/**
 * Explicit UI states for anchor generation flow.
 * No state maps to more than one visual outcome.
 */
const STATES = {
  LOADING_ANCHOR: 'loading_anchor',
  ANCHOR_READY: 'anchor_ready',
  NO_ANCHOR_FOR_CLASS: 'no_anchor_for_class',
  MISSING_REQUIRED_DATA: 'missing_required_data',
  SERVICE_ERROR: 'service_error'
};

export default function NextAction() {
  const navigate = useNavigate();
  const location = useLocation();
  const studentId = location.state?.studentId || localStorage.getItem('anchor_student_id');

  const [uiState, setUiState] = useState(STATES.LOADING_ANCHOR);
  const [loadingStep, setLoadingStep] = useState(0);
  const [suggestion, setSuggestion] = useState(null);
  const [missingFields, setMissingFields] = useState([]);
  const [clarificationPrompt, setClarificationPrompt] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [closerLoading, setCloserLoading] = useState(false);

  const generateAnchor = useCallback(async () => {
    if (!studentId) {
      navigate('/onboarding');
      return;
    }

    setUiState(STATES.LOADING_ANCHOR);
    setLoadingStep(0);

    // Animate loading steps independently of the request
    const timer1 = setTimeout(() => setLoadingStep(1), 1500);
    const timer2 = setTimeout(() => setLoadingStep(2), 3000);

    try {
      const data = await api.generateSuggestion(studentId);

      clearTimeout(timer1);
      clearTimeout(timer2);

      // Route on explicit status from backend
      switch (data.status) {
        case 'anchor_ready':
          setSuggestion(data);
          setUiState(STATES.ANCHOR_READY);
          break;

        case 'no_anchor_for_class':
          setUiState(STATES.NO_ANCHOR_FOR_CLASS);
          break;

        case 'missing_required_data':
          setMissingFields(data.missing_fields || []);
          setClarificationPrompt(data.clarification_prompt || null);
          setUiState(STATES.MISSING_REQUIRED_DATA);
          break;

        case 'service_error':
          setErrorCode(data.error_code || 'INTERNAL_ERROR');
          setUiState(STATES.SERVICE_ERROR);
          break;

        default:
          // Legacy response without status field (backward compat)
          if (data.suggestion) {
            setSuggestion(data);
            setUiState(STATES.ANCHOR_READY);
          } else {
            setUiState(STATES.NO_ANCHOR_FOR_CLASS);
          }
      }
    } catch {
      // Network failure, CORS, or server down — never show raw message
      clearTimeout(timer1);
      clearTimeout(timer2);
      setErrorCode('NETWORK_ERROR');
      setUiState(STATES.SERVICE_ERROR);
    }
  }, [studentId, navigate]);

  useEffect(() => {
    generateAnchor();
  }, [generateAnchor]);

  // ---- Action handlers ----

  async function handleAccept() {
    if (!suggestion?.suggestion?.id) return;
    setActionLoading(true);
    try {
      const interaction = await api.acceptSuggestion(suggestion.suggestion.id);
      navigate('/interaction', { state: { interactionId: interaction.id, studentId } });
    } catch {
      setErrorCode('ACCEPT_FAILED');
      setUiState(STATES.SERVICE_ERROR);
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
    } catch {
      // Silently stay on current location — non-critical action
    }
    setCloserLoading(false);
  }

  async function handleDecline(reason) {
    if (!suggestion?.suggestion?.id) return;
    try {
      await api.declineSuggestion(suggestion.suggestion.id, reason);
    } catch {
      // Best-effort decline — navigate anyway
    }
    navigate('/support');
  }

  function handleRetry() {
    generateAnchor();
  }

  function handlePickDifferentClass() {
    navigate('/onboarding');
  }

  // ---- Render by state ----

  if (uiState === STATES.LOADING_ANCHOR) {
    return <LoadingAnchor step={loadingStep} />;
  }

  if (uiState === STATES.MISSING_REQUIRED_DATA) {
    return (
      <MissingData
        missingFields={missingFields}
        clarificationPrompt={clarificationPrompt}
        onPickClass={handlePickDifferentClass}
        onRetry={handleRetry}
      />
    );
  }

  if (uiState === STATES.NO_ANCHOR_FOR_CLASS) {
    return (
      <NoAnchorFound
        onPickClass={handlePickDifferentClass}
        onRetry={handleRetry}
      />
    );
  }

  if (uiState === STATES.SERVICE_ERROR) {
    return (
      <ServiceError
        errorCode={errorCode}
        onRetry={handleRetry}
        onPickClass={handlePickDifferentClass}
      />
    );
  }

  // ANCHOR_READY
  const inv = suggestion?.invitation;
  const match = suggestion?.match;
  const placement = suggestion?.placement;
  const sug = suggestion?.suggestion;

  const myWalk = placement?.walk_minutes_by_participant?.[studentId];

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

      {/* Placement card */}
      <div className="card animate-in stagger-1" style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>📍</span>
          <div>
            <div className="card-label">Where</div>
            <div className="card-value">{sug?.location || placement?.recommended_location}</div>
          </div>
        </div>

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

        {placement?.fit_reason && (
          <div className="placement-detail">
            <span className="placement-icon">✓</span>
            <span className="placement-text">{placement.fit_reason}</span>
          </div>
        )}

        {placement?.time_fit_message && (
          <div className="placement-detail">
            <span className="placement-icon">◷</span>
            <span className="placement-text">{placement.time_fit_message}</span>
          </div>
        )}

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

      {/* Actions */}
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
          onClick={handleRetry}
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

// ---- State-specific components ----

function LoadingAnchor({ step }) {
  const steps = [
    'Checking your class and time overlap',
    'Finding the easiest meeting point',
    'Building your best first anchor'
  ];

  return (
    <div className="loading animate-in">
      <div className="loading-spinner" />
      <h3 style={{ marginTop: '16px', marginBottom: '24px' }}>Finding your easiest anchor</h3>
      <div style={{ textAlign: 'left', maxWidth: '300px' }}>
        {steps.map((text, i) => (
          <div key={i} className="placement-detail" style={{
            opacity: step >= i ? 1 : 0.3,
            transition: 'opacity 0.5s ease'
          }}>
            <span className="placement-icon" style={{
              color: step > i ? 'var(--accent)' : step === i ? 'var(--text-primary)' : 'var(--text-muted)'
            }}>
              {step > i ? '✓' : step === i ? '◌' : '○'}
            </span>
            <span className="placement-text" style={{
              color: step > i ? 'var(--accent)' : step === i ? 'var(--text-primary)' : 'var(--text-muted)'
            }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoAnchorFound({ onPickClass, onRetry }) {
  return (
    <div className="animate-in" style={{ textAlign: 'center', marginTop: '64px' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>◯</div>
      <h2 style={{ marginBottom: '8px' }}>We could not find a good anchor for this class yet.</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto 32px' }}>
        Try a different class or another routine moment.
      </p>
      <div className="btn-group vertical" style={{ maxWidth: '320px', margin: '0 auto' }}>
        <button id="no-anchor-pick-class" className="btn btn-primary btn-block" onClick={onPickClass}>
          Pick a different class
        </button>
        <button id="no-anchor-retry" className="btn btn-secondary btn-block" onClick={onRetry}>
          Try a different time
        </button>
      </div>
    </div>
  );
}

function MissingData({ missingFields, clarificationPrompt, onPickClass, onRetry }) {
  // Map missing fields to user-facing actions
  const fieldActions = {
    class_selection: { label: 'Choose a class', action: onPickClass },
    class_time: { label: 'Add time preference', action: onPickClass },
    location_zone: { label: 'Confirm location zone', action: onRetry },
    schedule_days: { label: 'Add your schedule', action: onPickClass },
    format_preference: { label: 'Choose pair or small group', action: onPickClass }
  };

  const primaryMissing = missingFields[0];
  const primaryAction = fieldActions[primaryMissing] || { label: 'Add missing detail', action: onPickClass };

  return (
    <div className="animate-in" style={{ textAlign: 'center', marginTop: '64px' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔍</div>
      <h2 style={{ marginBottom: '8px' }}>We need one more detail to build your anchor.</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto 24px' }}>
        {clarificationPrompt || 'Add one more detail so we can find a useful match.'}
      </p>
      <div className="btn-group vertical" style={{ maxWidth: '320px', margin: '0 auto' }}>
        <button id="missing-primary" className="btn btn-primary btn-block" onClick={primaryAction.action}>
          {primaryAction.label}
        </button>
        {missingFields.length > 1 && missingFields.slice(1).map(field => {
          const action = fieldActions[field];
          if (!action) return null;
          return (
            <button key={field} className="btn btn-secondary btn-block" onClick={action.action}>
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ServiceError({ onRetry, onPickClass }) {
  return (
    <div className="animate-in" style={{ textAlign: 'center', marginTop: '64px' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚡</div>
      <h2 style={{ marginBottom: '8px' }}>Something went wrong on our side.</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto 32px' }}>
        Your class selection is saved. Try again.
      </p>
      <div className="btn-group vertical" style={{ maxWidth: '320px', margin: '0 auto' }}>
        <button id="error-retry" className="btn btn-primary btn-block" onClick={onRetry}>
          Try again
        </button>
        <button id="error-pick-class" className="btn btn-secondary btn-block" onClick={onPickClass}>
          Pick a different class
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
