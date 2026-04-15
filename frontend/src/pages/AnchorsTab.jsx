import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const HEALTH_META = {
  weak: { label: 'Starting', color: 'var(--text-muted)', icon: '○' },
  forming: { label: 'Forming', color: '#f0ad4e', icon: '◐' },
  stable: { label: 'Stable', color: 'var(--accent)', icon: '●' },
  stalled: { label: 'Stalled', color: '#e05d5d', icon: '◌' }
};

export default function AnchorsTab() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('anchor_student_id');
  const [anchors, setAnchors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    api.getStudentAnchors(studentId)
      .then(data => {
        setAnchors(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (anchors.length === 0) {
    return (
      <div className="animate-in">
        <div className="page-header" style={{ marginTop: '32px' }}>
          <h1>Your anchors</h1>
          <p>Your recurring connections show up here once they form.</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⚓</div>
          <h3>No anchors yet</h3>
          <p>Complete your first interaction to start forming one.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '16px' }}>
            Find your first anchor
          </button>
        </div>
      </div>
    );
  }

  // Count total meetups across all anchors
  const totalMeetups = anchors.reduce((sum, a) => sum + (a.recent_interactions?.length || 0), 0);
  const stableCount = anchors.filter(a => a.anchor_health_state === 'stable').length;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <h1>Your anchors</h1>
        <p>These are your recurring connections. Stability matters more than quantity.</p>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div className="card animate-in stagger-1" style={{ flex: 1, textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent)' }}>{anchors.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {anchors.length === 1 ? 'Anchor' : 'Anchors'}
          </div>
        </div>
        <div className="card animate-in stagger-2" style={{ flex: 1, textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent)' }}>{totalMeetups}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {totalMeetups === 1 ? 'Meetup' : 'Meetups'}
          </div>
        </div>
        <div className="card animate-in stagger-3" style={{ flex: 1, textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: stableCount > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>{stableCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Stable</div>
        </div>
      </div>

      {/* Anchor cards */}
      {anchors.map((anchor, i) => {
        const health = HEALTH_META[anchor.anchor_health_state] || HEALTH_META.weak;
        const meetupCount = anchor.recent_interactions?.length || 0;

        return (
          <div key={anchor.id} className={`card animate-in stagger-${i + 4}`} style={{ marginBottom: '12px' }}>
            {/* Header row: title + health badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ textTransform: 'capitalize', fontSize: '1rem' }}>
                {anchor.purpose_type?.replace(/_/g, ' ')} anchor
              </h3>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '0.75rem', fontWeight: 500, color: health.color,
                background: 'var(--card-bg)', padding: '4px 10px', borderRadius: '12px'
              }}>
                {health.icon} {health.label}
              </span>
            </div>

            {/* People */}
            <div className="placement-detail">
              <span className="placement-icon">👤</span>
              <span className="placement-text">
                {anchor.participants?.map(p => p.name).join(', ') || 'Peer connection'}
              </span>
            </div>

            {/* Recurrence + meetup count */}
            <div className="placement-detail">
              <span className="placement-icon">🔁</span>
              <span className="placement-text" style={{ textTransform: 'capitalize' }}>
                {anchor.recurrence_pattern || 'Weekly'} · {meetupCount} {meetupCount === 1 ? 'meetup' : 'meetups'} completed
              </span>
            </div>

            {/* Next scheduled touch */}
            {anchor.next_interaction_at && (
              <div className="placement-detail">
                <span className="placement-icon">📅</span>
                <span className="placement-text">Next: {anchor.next_interaction_at}</span>
              </div>
            )}

            {/* Stalled anchor action */}
            {anchor.anchor_health_state === 'stalled' && (
              <button
                className="btn btn-secondary btn-block"
                style={{ marginTop: '12px', fontSize: '0.85rem' }}
                onClick={() => navigate('/support')}
              >
                Try something different
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
