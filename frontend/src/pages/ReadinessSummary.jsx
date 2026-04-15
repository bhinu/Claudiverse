import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function ReadinessSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const studentId = location.state?.studentId || localStorage.getItem('anchor_student_id');
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) {
      navigate('/onboarding');
      return;
    }

    api.getReadiness(studentId)
      .then(data => {
        setReadiness(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [studentId, navigate]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Analyzing your routine</p>
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

  const summary = readiness?.readiness_summary;
  const risk = readiness?.anchor_risk;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <p className="text-accent" style={{ fontWeight: 500, marginBottom: '8px' }}>Your anchor readiness</p>
        <h1>You're most likely to benefit from a {risk?.recommended_intervention_type?.replace(/_/g, ' ') || 'post-class anchor'}.</h1>
      </div>

      <div className="card card-accent animate-in stagger-1">
        <div className="card-label">Best moment this week</div>
        <div className="card-value">{summary?.best_moment}</div>
      </div>

      <div className="card animate-in stagger-2">
        <div className="card-label">Best format</div>
        <div className="card-value" style={{ textTransform: 'capitalize' }}>{summary?.best_format?.replace(/_/g, ' ')}</div>
      </div>

      <div className="card animate-in stagger-3">
        <div className="card-label">Expected time</div>
        <div className="card-value">{summary?.estimated_time}</div>
      </div>

      <div className="card animate-in stagger-4">
        <div className="card-label">Why this is a fit</div>
        <div className="card-value">{summary?.why_fit}</div>
      </div>

      {risk?.top_reasons && (
        <div className="card animate-in" style={{ marginTop: '16px' }}>
          <div className="card-label">What we noticed</div>
          {risk.top_reasons.map((reason, i) => (
            <p key={i} style={{ marginTop: i > 0 ? '6px' : 0, fontSize: '0.88rem' }}>{reason}</p>
          ))}
        </div>
      )}

      <div className="btn-group vertical" style={{ marginTop: '24px' }}>
        <button
          id="readiness-next"
          className="btn btn-primary btn-block"
          onClick={() => navigate('/action', { state: { studentId } })}
        >
          Show me my anchor
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => navigate('/support')}>
          I need something different
        </button>
      </div>
    </div>
  );
}
