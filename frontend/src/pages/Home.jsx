import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Home() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('anchor_student_id');
  const studentName = localStorage.getItem('anchor_student_name');
  const [student, setStudent] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [anchors, setAnchors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    Promise.all([
      api.getStudent(studentId).catch(() => null),
      api.getStudentSuggestions(studentId).catch(() => []),
      api.getStudentAnchors(studentId).catch(() => [])
    ]).then(([s, sug, anch]) => {
      setStudent(s);
      setSuggestions(sug);
      setAnchors(anch);
      setLoading(false);
    });
  }, [studentId]);

  // Not onboarded yet — show landing page with demo students
  if (!studentId) {
    return (
      <div className="animate-in" style={{ marginTop: '64px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Anchor OS</h1>
        <p style={{ maxWidth: '300px', margin: '0 auto 32px', fontSize: '1rem' }}>
          We help you find one useful recurring connection tied to your real week.
        </p>
        <button
          id="home-start"
          className="btn btn-primary"
          onClick={() => navigate('/onboarding')}
          style={{ padding: '14px 36px', fontSize: '1rem' }}
        >
          Get started
        </button>

        <div className="divider" style={{ margin: '40px auto', maxWidth: '120px' }} />

        <p className="text-muted" style={{ maxWidth: '280px', margin: '0 auto' }}>
          Takes less than 90 seconds. No profile required.
        </p>

        {/* Demo mode selector */}
        <div style={{ marginTop: '48px' }}>
          <p className="text-muted" style={{ marginBottom: '12px' }}>Or try a demo student</p>
          <DemoSelector onSelect={(id, name) => {
            localStorage.setItem('anchor_student_id', id);
            localStorage.setItem('anchor_student_name', name);
            window.location.reload();
          }} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  const pendingSuggestion = suggestions.find(s => s.status === 'pending');
  const hasAnchors = anchors.length > 0;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <p className="text-muted" style={{ marginBottom: '4px' }}>Welcome back</p>
        <h1>{studentName || student?.name || 'Student'}</h1>
      </div>

      {/* Pending suggestion card */}
      {pendingSuggestion && (
        <div className="card card-accent animate-in stagger-1" style={{ cursor: 'pointer' }} onClick={() => navigate('/action', { state: { studentId } })}>
          <p className="text-accent" style={{ fontWeight: 500, marginBottom: '4px', fontSize: '0.85rem' }}>Pending suggestion</p>
          <h3>{pendingSuggestion.invitation_title || 'You have a suggestion'}</h3>
          <p style={{ marginTop: '4px' }}>{pendingSuggestion.invitation_body || 'Tap to see details.'}</p>
        </div>
      )}

      {/* Find your anchor — always available if no anchors yet */}
      {!hasAnchors && !pendingSuggestion && (
        <div className="card card-accent animate-in stagger-1" style={{ cursor: 'pointer' }} onClick={() => navigate('/action', { state: { studentId } })}>
          <p className="text-accent" style={{ fontWeight: 500, marginBottom: '4px', fontSize: '0.85rem' }}>Recommended</p>
          <h3>Find your first anchor</h3>
          <p style={{ marginTop: '4px' }}>We will look at your routine and find the easiest starting point.</p>
        </div>
      )}

      {/* Check for new anchors — if they already have some */}
      {hasAnchors && !pendingSuggestion && (
        <div className="card animate-in stagger-1" style={{ cursor: 'pointer' }} onClick={() => navigate('/action', { state: { studentId } })}>
          <h3>Check for new anchors</h3>
          <p style={{ marginTop: '4px' }}>See if there is a good fit for your routine this week.</p>
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
        <div className="card animate-in stagger-2" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => navigate('/anchors')}>
          <span style={{ fontSize: '1.5rem' }}>⚓</span>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>My anchors</p>
        </div>
        <div className="card animate-in stagger-3" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => navigate('/week')}>
          <span style={{ fontSize: '1.5rem' }}>▦</span>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>This week</p>
        </div>
      </div>

      {/* Reset for demo */}
      <button
        className="btn btn-ghost btn-block"
        style={{ marginTop: '32px', fontSize: '0.8rem' }}
        onClick={() => {
          localStorage.removeItem('anchor_student_id');
          localStorage.removeItem('anchor_student_name');
          window.location.reload();
        }}
      >
        Switch student (demo)
      </button>
    </div>
  );
}

function DemoSelector({ onSelect }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    api.getStudents().then(setStudents).catch(() => {});
  }, []);

  if (students.length === 0) return null;

  return (
    <div className="chip-group" style={{ justifyContent: 'center' }}>
      {students.slice(0, 4).map(s => (
        <button key={s.id} className="chip" onClick={() => onSelect(s.id, s.name)}>
          {s.name}
        </button>
      ))}
    </div>
  );
}
