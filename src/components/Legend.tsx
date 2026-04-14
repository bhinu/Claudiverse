"use client";

/** Compact legend explaining node colours. */
export default function Legend() {
  const items = [
    { color: "#10b981", label: "Hopeful / Positive" },
    { color: "#22d3ee", label: "Mildly Positive" },
    { color: "#a855f7", label: "Mildly Negative" },
    { color: "#f43f5e", label: "Burdened / Painful" },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-0.5">
        Sentiment Key
      </p>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: item.color,
              boxShadow: `0 0 5px ${item.color}88`,
            }}
          />
          <span className="text-[11px] text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
