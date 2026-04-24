window.FiveApp = window.FiveApp || {};

function Principles({ onBack }) {
  const serif = "ui-serif, Georgia, Cambria, 'Times New Roman', serif";
  const principles = [
    { title: "Five minutes.", body: "Small enough to start. Big enough to count. The mechanism is not time management — it is lowering the activation energy past the point where the mind can bargain with itself. Once motion begins, continuing is usually easier than stopping, so one block becomes two, and two become four, and at the end of the hour there is something to show for it." },
    { title: "One thing, with its companions.", body: "Do one thing at a time. But one thing is rarely only one thing — a task contains its own small subtasks, thoughts, and adjustments. Let them live under the same block. Five minutes of reading might also have been thinking, and note-taking, and a moment of staring at the wall. Record all of them together. The single-focus rule is about attention, not about bookkeeping." },
    { title: "Friction is the enemy.", body: "Log first. Tag later. The app should never interrupt the work to ask for metadata. If naming what you did would slow you down, skip the naming — the ledger accepts untitled entries, and you can tag them later by tapping them." },
    { title: "A ledger, not a leaderboard.", body: "There are no streaks, no goals, no targets, no badges. The app does not praise consistency and does not punish gaps. It counts. Counting alone, done honestly, is usually enough — and anything more starts to bend the practice toward performance instead of work." },
    { title: "Answer the quiet voice.", body: "The voice that asks but what have I actually been doing. That voice is corrosive, and unanswered it eats through the practice. The ledger exists to answer it with evidence. A number you can see. A total you can believe. A record that cannot be argued with, because it was written by you, one five at a time." },
    { title: "Every tag earns its full minutes.", body: "When a five-minute block carries more than one tag, each tag is credited the full five minutes. A block tagged reading and thinking counts as five minutes of reading and five minutes of thinking. The activities genuinely happened together; neither one is half-real because the other was also present. The per-tag sums may exceed the clock — that is not an error, it is the acknowledgment that attention can hold more than one thing at once." }
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div className="max-w-md mx-auto px-5 py-6">
        <div className="flex items-baseline justify-between mb-10">
          <h1 className="text-3xl italic tracking-tight" style={{ fontFamily: serif }}>Five.</h1>
          <button onClick={onBack} className="text-xs text-stone-500 hover:text-stone-900 tracking-widest uppercase">← back to log</button>
        </div>

        <div className="mb-8 pb-4 border-b border-stone-300">
          <div className="text-xs text-stone-500 uppercase tracking-widest mb-1">principles</div>
          <div className="text-sm text-stone-400 italic" style={{ fontFamily: serif }}>the ideas behind the app — a beginning, not a conclusion.</div>
        </div>

        <div className="space-y-8">
          {principles.map((p, i) => (
            <div key={i}>
              <div className="flex items-baseline gap-3 mb-2">
                <div className="text-xs text-stone-400 tabular-nums" style={{ fontFamily: serif }}>{String(i + 1).padStart(2, "0")}</div>
                <h2 className="text-xl italic text-stone-900" style={{ fontFamily: serif }}>{p.title}</h2>
              </div>
              <p className="text-sm text-stone-700 leading-relaxed ml-7">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-stone-200 text-center">
          <div className="text-xs text-stone-400 italic" style={{ fontFamily: serif }}>more to come. this section will grow with use.</div>
        </div>

        <div className="text-center mt-10 text-xs text-stone-300 italic" style={{ fontFamily: serif }}>do one small thing. then another.</div>
      </div>
    </div>
  );
}

window.FiveApp.components = window.FiveApp.components || {};
window.FiveApp.components.Principles = Principles;
