import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function ThisWeek() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('anchor_student_id');
  const [interactions, setInteractions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    Promise.all([
      api.getStudentInteractions(studentId).catch(() => []),
      api.getStudentSuggestions(studentId).catch(() => [])
    ]).then(([ints, sugs]) => {
      setInteractions(ints);
      setSuggestions(sugs);
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

  const upcoming = interactions.filter(i => i.status === 'upcoming');
  const completed = interactions.filter(i => i.status === 'completed');
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <h1>This week</h1>
        <p>Anchor moments tied to your routine.</p>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Coming up
          </h3>
          {upcoming.map((int, i) => (
            <div
              key={int.id}
              className={`card card-accent animate-in stagger-${i + 1}`}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/interaction', { state: { interactionId: int.id, studentId } })}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ textTransform: 'capitalize' }}>{int.purpose || 'Anchor meeting'}</h4>
                  <p style={{ fontSize: '0.85rem', marginTop: '2px' }}>{int.scheduled_at} · {int.duration_minutes} min · {int.location}</p>
                </div>
                <span className="badge badge-forming">Upcoming</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending suggestions */}
      {pendingSuggestions.length > 0 && (
        <div style={{ marginTop: upcoming.length > 0 ? '24px' : 0 }}>
          <h3 style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Suggested
          </h3>
          {pendingSuggestions.map((sug, i) => (
            <div
              key={sug.id}
              className={`card animate-in stagger-${i + 1}`}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/action', { state: { studentId } })}
            >
              <h4>{sug.invitation_title || 'New suggestion'}</h4>
              <p style={{ fontSize: '0.85rem', marginTop: '2px' }}>{sug.invitation_body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Completed
          </h3>
          {completed.map((int, i) => (
            <div key={int.id} className={`card animate-in stagger-${i + 1}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ textTransform: 'capitalize' }}>{int.purpose || 'Anchor meeting'}</h4>
                  <p style={{ fontSize: '0.85rem', marginTop: '2px' }}>{int.scheduled_at}</p>
                </div>
                <span className="badge badge-stable">Done</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {upcoming.length === 0 && completed.length === 0 && pendingSuggestions.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">▦</div>
          <h3>Nothing scheduled yet</h3>
          <p>Once you accept a suggestion, it shows up here.</p>
          <button className="btn btn-primary" onClick={() => navigate('/action', { state: { studentId } })} style={{ marginTop: '16px' }}>
            Find an anchor
          </button>
        </div>
      )}
    </div>
  );
}
