window.FiveApp = window.FiveApp || {};
window.FiveApp.logComponents = window.FiveApp.logComponents || {};

function TagComposer({ selectedTags, topTags, toggleTag, clearCompose, tagInput, setTagInput, addFromInput, serif }) {
  return (
    <>
      {selectedTags.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs text-stone-500 tracking-wide">staged (tap to remove):</div>
            <button onClick={clearCompose} className="text-xs text-stone-400 hover:text-stone-900 tracking-wide underline-offset-2 hover:underline">clear all</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((t) => (
              <button key={t} onClick={() => toggleTag(t)} className="px-3 py-1.5 text-sm bg-stone-900 text-stone-50 active:scale-95 transition-all flex items-center gap-1.5" style={{ borderRadius: "999px" }}>
                {t} <span className="opacity-60">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {topTags.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-stone-500 mb-2 tracking-wide">tap to select:</div>
          <div className="flex flex-wrap gap-2">
            {topTags.map(({ tag, count }) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 text-sm border transition-all active:scale-95 ${isSelected ? "bg-stone-900 text-stone-50 border-stone-900" : "bg-white text-stone-900 border-stone-300 hover:bg-amber-50 hover:border-amber-700"}`} style={{ borderRadius: "999px" }}>
                  {tag} <span className={`text-xs tabular-nums ml-1 ${isSelected ? "opacity-60" : "text-stone-400"}`} style={{ fontFamily: serif }}>· {count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-5 flex gap-2">
        <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFromInput(); } }} placeholder="new activity (commas for many)…" className="flex-1 border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-amber-700" style={{ borderRadius: "2px" }} />
        <button onClick={addFromInput} disabled={!tagInput.trim()} className="px-4 py-2 text-sm bg-stone-100 border border-stone-300 text-stone-700 hover:bg-stone-200 disabled:opacity-40 tracking-wide" style={{ borderRadius: "2px" }}>add</button>
      </div>
    </>
  );
}

window.FiveApp.logComponents.TagComposer = TagComposer;
