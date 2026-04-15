import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import HealthBadge from '../components/HealthBadge';

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
        <p>Loading your anchors</p>
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
          <button className="btn btn-primary" onClick={() => navigate('/onboarding')} style={{ marginTop: '16px' }}>
            Get started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <h1>Your anchors</h1>
        <p>These are your recurring connections.</p>
      </div>

      {anchors.map((anchor, i) => (
        <div key={anchor.id} className={`card animate-in stagger-${i + 1}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ textTransform: 'capitalize' }}>{anchor.purpose_type} {anchor.anchor_type}</h3>
            <HealthBadge state={anchor.anchor_health_state} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <span className="card-label">People</span>
              <p style={{ fontSize: '0.9rem' }}>
                {anchor.participants?.map(p => p.name).join(', ') || 'Loading...'}
              </p>
            </div>

            <div>
              <span className="card-label">Recurrence</span>
              <p style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>{anchor.recurrence_pattern}</p>
            </div>

            {anchor.next_interaction_at && (
              <div>
                <span className="card-label">Next</span>
                <p style={{ fontSize: '0.9rem' }}>{anchor.next_interaction_at}</p>
              </div>
            )}

            {anchor.recent_interactions?.length > 0 && (
              <div>
                <span className="card-label">Last interaction</span>
                <p style={{ fontSize: '0.9rem' }}>
                  {anchor.recent_interactions[0].status === 'completed' ? 'Completed' : anchor.recent_interactions[0].status}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
