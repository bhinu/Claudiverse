import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LiveSupport() {
  const navigate = useNavigate();
  const location = useLocation();
  const interactionId = location.state?.interactionId;
  const studentId = location.state?.studentId || localStorage.getItem('anchor_student_id');
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      number: 1,
      title: 'Quick intro',
      instruction: 'Share your name and what you are studying or where you transferred from. Keep it to one sentence.',
    },
    {
      number: 2,
      title: 'Useful prompt',
      instruction: 'Each of you share one thing from class that felt useful or one thing that felt confusing. Listen, and see if you noticed the same thing.',
    },
    {
      number: 3,
      title: "What\u2019s next?",
      instruction: 'Decide together if you want to do this again next week at the same time. One of you can say "same time next week?" and that is enough.',
    }
  ];

  const isLast = currentStep === steps.length - 1;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginTop: '32px' }}>
        <p className="text-accent" style={{ fontWeight: 500, marginBottom: '8px' }}>Interaction guide</p>
        <h1>You've got this. Here's a light structure.</h1>
        <p style={{ marginTop: '8px' }}>This guide disappears once you get comfortable.</p>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              height: '4px',
              flex: 1,
              borderRadius: '2px',
              background: i <= currentStep ? 'var(--accent)' : 'var(--bg-elevated)',
              transition: 'background 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Current step */}
      <div className="card card-accent animate-in" key={currentStep}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div className="step-number">{steps[currentStep].number}</div>
          <div>
            <h3 style={{ marginBottom: '8px' }}>{steps[currentStep].title}</h3>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
              {steps[currentStep].instruction}
            </p>
          </div>
        </div>
      </div>

      <div className="btn-group vertical" style={{ marginTop: '24px' }}>
        {!isLast ? (
          <button
            id="live-next-step"
            className="btn btn-primary btn-block"
            onClick={() => setCurrentStep(s => s + 1)}
          >
            Next step
          </button>
        ) : (
          <button
            id="live-done"
            className="btn btn-primary btn-block"
            onClick={() => navigate('/reflect', { state: { interactionId, studentId } })}
          >
            Done, let me reflect
          </button>
        )}

        {currentStep > 0 && (
          <button className="btn btn-ghost btn-block" onClick={() => setCurrentStep(s => s - 1)}>
            Previous step
          </button>
        )}
      </div>

      <p className="text-muted" style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem' }}>
        This took about 2 minutes to read. The actual interaction is yours.
      </p>
    </div>
  );
}
