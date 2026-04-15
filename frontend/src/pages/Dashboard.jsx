import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Loading dashboard</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <h3>Dashboard not available</h3>
      </div>
    );
  }

  const o = data.overview;

  return (
    <div className="animate-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Anchor OS Dashboard</h1>
          <p>Buyer view — anchor formation overview</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>Student view</button>
      </div>

      {/* Key metrics */}
      <div className="stats-grid">
        <div className="stat-card animate-in stagger-1">
          <div className="stat-value">{o.onboarded_students}</div>
          <div className="stat-label">Onboarded</div>
        </div>
        <div className="stat-card animate-in stagger-2">
          <div className="stat-value">{o.total_anchors}</div>
          <div className="stat-label">Anchors formed</div>
        </div>
        <div className="stat-card animate-in stagger-3">
          <div className="stat-value">{o.anchor_formation_rate}%</div>
          <div className="stat-label">Formation rate</div>
        </div>
        <div className="stat-card animate-in stagger-4">
          <div className="stat-value">{o.suggestion_acceptance_rate}%</div>
          <div className="stat-label">Acceptance rate</div>
        </div>
      </div>

      {/* Risk breakdown */}
      <div className="card animate-in">
        <h3 style={{ marginBottom: '16px' }}>Risk breakdown</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {data.risk_breakdown.map(r => (
            <div key={r.anchor_risk_state} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge badge-risk-${r.anchor_risk_state}`}>{r.anchor_risk_state}</span>
              <span style={{ fontWeight: 600 }}>{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cohort breakdown */}
      <div className="card animate-in">
        <h3 style={{ marginBottom: '16px' }}>By cohort</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {data.cohort_breakdown.map(c => (
            <div key={c.cohort_type}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>{c.count}</div>
              <div className="text-muted" style={{ textTransform: 'capitalize' }}>{c.cohort_type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel */}
      <div className="card animate-in">
        <h3 style={{ marginBottom: '16px' }}>Engagement funnel</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <FunnelRow label="Suggestions sent" value={data.suggestions.total} max={Math.max(data.suggestions.total, 1)} />
          <FunnelRow label="Accepted" value={data.suggestions.accepted} max={Math.max(data.suggestions.total, 1)} color="var(--accent)" />
          <FunnelRow label="Interactions completed" value={data.interactions.completed} max={Math.max(data.suggestions.total, 1)} color="var(--health-stable)" />
          <FunnelRow label="Positive reflections" value={data.reflections.positive} max={Math.max(data.suggestions.total, 1)} color="var(--amber)" />
        </div>
      </div>

      {/* Anchor health */}
      {data.anchor_health.length > 0 && (
        <div className="card animate-in">
          <h3 style={{ marginBottom: '16px' }}>Anchor health</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {data.anchor_health.map(h => (
              <div key={h.anchor_health_state} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge badge-${h.anchor_health_state}`}>{h.anchor_health_state}</span>
                <span style={{ fontWeight: 600 }}>{h.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High risk unresolved */}
      {data.unanchored_high_risk.length > 0 && (
        <div className="card animate-in" style={{ borderColor: 'rgba(232, 124, 90, 0.3)' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--risk-high)' }}>Needs attention</h3>
          <p style={{ marginBottom: '12px', fontSize: '0.85rem' }}>High risk students without anchors.</p>
          {data.unanchored_high_risk.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontWeight: 500 }}>{s.name}</span>
                <span className="text-muted" style={{ marginLeft: '8px' }}>{s.cohort_type}</span>
              </div>
              {s.days_since_onboarding !== null && (
                <span className="text-muted">{s.days_since_onboarding}d since onboarding</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FunnelRow({ label, value, max, color = 'var(--text-muted)' }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{value}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
