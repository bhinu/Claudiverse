import { useNavigate } from 'react-router-dom';

export default function Support() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('anchor_student_id');

  const options = [
    {
      id: 'support-different-time',
      icon: '◷',
      title: 'Try a different time slot',
      description: 'We can look for another moment in your routine that might work better.',
      action: () => navigate('/action', { state: { studentId } })
    },
    {
      id: 'support-group-switch',
      icon: '◬',
      title: 'Switch from pair to small group',
      description: 'Sometimes a third person makes conversation easier.',
      action: () => navigate('/action', { state: { studentId } })
    },
    {
      id: 'support-mentor',
      icon: '◉',
      title: 'Get peer mentor support',
      description: 'A peer mentor can join your first interaction to make it smoother.',
      action: () => {} // placeholder
    },
    {
      id: 'support-staff',
      icon: '◈',
      title: 'Talk to staff',
      description: 'Your student support office can help with anything we cannot.',
      action: () => {} // placeholder
    }
  ];

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <h1>We're here to help.</h1>
        <p>If the first suggestion didn't fit, that's okay. Here are other paths.</p>
      </div>

      {options.map((opt, i) => (
        <button
          key={opt.id}
          id={opt.id}
          className={`card animate-in stagger-${i + 1}`}
          onClick={opt.action}
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border)' }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{opt.icon}</span>
            <div>
              <h4 style={{ marginBottom: '4px' }}>{opt.title}</h4>
              <p style={{ fontSize: '0.85rem' }}>{opt.description}</p>
            </div>
          </div>
        </button>
      ))}

      <div className="divider" />

      <p className="text-muted" style={{ textAlign: 'center' }}>
        You're never stuck. There's always a next step.
      </p>
    </div>
  );
}
