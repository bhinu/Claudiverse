export default function HealthBadge({ state }) {
  const labels = {
    weak: 'Weak',
    forming: 'Forming',
    stable: 'Stable',
    stalled: 'Stalled',
    unknown: 'Pending'
  };

  return (
    <span className={`badge badge-${state || 'weak'}`}>
      {labels[state] || labels.unknown}
    </span>
  );
}
