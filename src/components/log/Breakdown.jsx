window.FiveApp = window.FiveApp || {};
window.FiveApp.logComponents = window.FiveApp.logComponents || {};

function Breakdown({ title, groups, total, serif }) {
  const max = Math.max(1, ...groups.map((g) => g.count));

  return (
    <div className="mb-10">
      <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-stone-300">
        <div className="text-xs text-stone-500 uppercase tracking-widest">{title}</div>
        {total > 0 && <div className="text-xs text-stone-400 tabular-nums">{total} · {total * 5}m</div>}
      </div>
      {groups.length === 0 ? (
        <div className="text-sm text-stone-400 italic py-4 text-center" style={{ fontFamily: serif }}>nothing {title.toLowerCase()}.</div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const pct = (g.count / max) * 100;
            return (
              <div key={g.key} className="flex items-center gap-3">
                <div className={`text-sm flex-shrink-0 ${g.label ? "text-stone-900" : "text-stone-400 italic"}`} style={{ width: "92px", fontFamily: g.label ? "inherit" : serif, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {g.label || "untitled"}
                </div>
                <div className="flex-1 h-2 bg-stone-100 relative overflow-hidden" style={{ borderRadius: "1px" }}>
                  <div className="absolute left-0 top-0 h-full bg-amber-700" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-stone-500 tabular-nums flex-shrink-0 text-right" style={{ fontFamily: serif, width: "60px" }}>
                  {g.count} · {g.count * 5}m
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

window.FiveApp.logComponents.Breakdown = Breakdown;
