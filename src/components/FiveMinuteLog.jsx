window.FiveApp = window.FiveApp || {};

function FiveMinuteLog({ session, onSignOut, darkMode, toggleTheme }) {
  const { useState, useCallback } = React;
  const { DURATION } = window.FiveApp.constants;
  const { parseTags, tagsToNote } = window.FiveApp.tags;
  const { loadCache, saveCache, loadQueue, saveQueue } = window.FiveApp.storage;
  const { formatTimeAgo } = window.FiveApp.format;
  const { supa } = window.FiveApp.config;
  const { Principles } = window.FiveApp.components;
  const { useEntrySync, useTagComposer, useFiveTimer, useLogStats } = window.FiveApp.logHooks;
  const { Breakdown, TimerPanel, TagComposer } = window.FiveApp.logComponents;

  const [view, setView] = useState("log");
  const [showTimer, setShowTimer] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const userId = session.user.id;

  const { entries, setEntries, loading, syncState, enqueue, flushQueue } = useEntrySync({
    userId,
    supa,
    loadCache,
    saveCache,
    loadQueue,
    saveQueue,
  });

  const {
    selectedTags,
    setSelectedTags,
    tagInput,
    setTagInput,
    toggleTag,
    addFromInput,
    clearCompose,
    composeFinalTags,
  } = useTagComposer({ parseTags });

  const createEntry = () => {
    const finalTags = composeFinalTags();
    const note = tagsToNote(finalTags);
    return { entry: { id: Date.now(), timestamp: Date.now(), note }, finalTags, note };
  };

  const {
    timeLeft,
    running,
    justLogged,
    setJustLogged,
    startTimer,
    pauseTimer,
    resetTimer,
    releaseWakeLock,
    setOnComplete,
  } = useFiveTimer({ duration: DURATION });

  const autoLog = useCallback(async () => {
    const { entry, finalTags, note } = createEntry();
    setEntries((prev) => [entry, ...prev]);
    enqueue({ type: "insert", id: entry.id, timestamp: entry.timestamp, note });
    setSelectedTags(finalTags);
    setTagInput("");
    setJustLogged(true);
    releaseWakeLock();

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = "sine";
        o.frequency.value = 660;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        o.start();
        o.stop(ctx.currentTime + 0.65);
      }
    } catch (e) {}

    try { if (navigator.vibrate) navigator.vibrate([120, 80, 120]); } catch (e) {}
    flushQueue();
  }, [entries, tagInput, selectedTags]);

  setOnComplete(autoLog);

  const logComposed = async () => {
    const { entry, finalTags, note } = createEntry();
    setEntries((prev) => [entry, ...prev]);
    enqueue({ type: "insert", id: entry.id, timestamp: entry.timestamp, note });
    setSelectedTags(finalTags);
    setTagInput("");
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
    flushQueue();
  };

  const commitEdit = async () => {
    if (editingId == null) return;
    const note = tagsToNote(parseTags(editDraft));
    setEntries((prev) => prev.map((e) => e.id === editingId ? { ...e, note } : e));
    enqueue({ type: "update", id: editingId, note });
    setEditingId(null);
    setEditDraft("");
    flushQueue();
  };

  const deleteEntry = async (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    enqueue({ type: "delete", id });
    if (editingId === id) {
      setEditingId(null);
      setEditDraft("");
    }
    flushQueue();
  };

  const clearAll = async () => {
    setEntries([]);
    enqueue({ type: "clear" });
    setConfirmClear(false);
    flushQueue();
  };

  const { todayCount, totalCount, totalMinutes, weekEntries, todayGroups, weekGroups, topTags, last7, maxCount } = useLogStats({ entries, parseTags });

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const progress = ((DURATION - timeLeft) / DURATION) * 100;
  const entryNumber = (index) => `#${String(totalCount - index).padStart(4, "0")}`;
  const serif = "ui-serif, Georgia, Cambria, 'Times New Roman', serif";

  const effectiveTags = composeFinalTags();
  const logLabel = (() => {
    if (effectiveTags.length === 0) return "+ Log a five";
    if (effectiveTags.length === 1) return `+ Log a five: ${effectiveTags[0]}`;
    if (effectiveTags.length === 2) return `+ Log a five: ${effectiveTags[0]}, ${effectiveTags[1]}`;
    return `+ Log a five · ${effectiveTags.length} tags`;
  })();

  const syncBadge = {
    idle: { dot: "bg-green-600", text: "synced" },
    syncing: { dot: "bg-amber-500 animate-pulse", text: "syncing…" },
    offline: { dot: "bg-stone-400", text: "offline" },
    error: { dot: "bg-red-600", text: "sync error" },
  }[syncState];

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="text-stone-400 text-sm italic" style={{ fontFamily: serif }}>opening the ledger…</div></div>;
  if (view === "principles") return <Principles onBack={() => setView("log")} />;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <style>{`input, textarea, select { font-size: 16px !important; } button, input, textarea, [role="button"] { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }`}</style>
      <div className="max-w-md mx-auto px-5 py-6">
        <div className="flex items-baseline justify-between mb-2">
          <h1 className="text-3xl italic tracking-tight" style={{ fontFamily: serif }}>Five.</h1>
          <button onClick={() => setView("principles")} className="text-xs text-stone-400 hover:text-stone-900 tracking-widest uppercase">principles · a logbook</button>
        </div>
        <div className="flex items-center justify-between mb-6 text-xs text-stone-400">
          <div className="flex items-center gap-1.5"><span className={`inline-block w-1.5 h-1.5 rounded-full ${syncBadge.dot}`}></span><span>{syncBadge.text}</span></div>
          <div className="flex items-center gap-3"><button onClick={toggleTheme} className="text-stone-400 hover:text-stone-700 tracking-wide">{darkMode ? "light" : "dark"}</button><button onClick={onSignOut} className="text-stone-400 hover:text-stone-700 tracking-wide">sign out</button></div>
        </div>

        <div className="mb-4"><button onClick={logComposed} className="w-full bg-stone-900 text-stone-50 py-5 text-base tracking-wide hover:bg-stone-800 active:scale-95 transition-all" style={{ borderRadius: "2px" }}>{logLabel}</button></div>

        <TagComposer
          selectedTags={selectedTags}
          topTags={topTags}
          toggleTag={toggleTag}
          clearCompose={clearCompose}
          tagInput={tagInput}
          setTagInput={setTagInput}
          addFromInput={addFromInput}
          serif={serif}
        />

        <TimerPanel
          showTimer={showTimer}
          setShowTimer={setShowTimer}
          justLogged={justLogged}
          totalCount={totalCount}
          serif={serif}
          m={m}
          s={s}
          progress={progress}
          running={running}
          timeLeft={timeLeft}
          DURATION={DURATION}
          startTimer={startTimer}
          resetTimer={resetTimer}
          pauseTimer={pauseTimer}
          setJustLogged={setJustLogged}
        />

        <Breakdown title="Today" groups={todayGroups} total={todayCount} serif={serif} />

        <div className="grid grid-cols-3 mb-8">
          <div className="pr-3"><div className="text-3xl tabular-nums" style={{ fontFamily: serif }}>{todayCount}</div><div className="text-xs text-stone-500 mt-1 tracking-wide">today</div></div>
          <div className="px-3 border-l border-stone-200"><div className="text-3xl tabular-nums" style={{ fontFamily: serif }}>{totalCount}</div><div className="text-xs text-stone-500 mt-1 tracking-wide">total</div></div>
          <div className="pl-3 border-l border-stone-200"><div className="text-3xl tabular-nums" style={{ fontFamily: serif }}>{hours}<span className="text-base text-stone-400">h</span> {mins}<span className="text-base text-stone-400">m</span></div><div className="text-xs text-stone-500 mt-1 tracking-wide">logged</div></div>
        </div>

        <div className="mb-10">
          <div className="flex items-end justify-between gap-2" style={{ height: "64px" }}>
            {last7.map((d, i) => {
              const h = d.count > 0 ? Math.max(3, (d.count / maxCount) * 48) : 2;
              const isToday = i === 6;
              return <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5" style={{ height: "64px" }}><div className="text-xs text-stone-500 tabular-nums" style={{ fontFamily: serif, minHeight: "14px" }}>{d.count > 0 ? d.count : ""}</div><div className={`w-full rounded-sm ${isToday ? "bg-amber-700" : "bg-stone-300"}`} style={{ height: `${h}px` }} /></div>;
            })}
          </div>
          <div className="flex justify-between gap-2 mt-2">{last7.map((d, i) => { const isToday = i === 6; return <div key={i} className={`flex-1 text-center text-xs tracking-wide ${isToday ? "text-amber-700 font-medium" : "text-stone-400"}`}>{["S", "M", "T", "W", "T", "F", "S"][d.date.getDay()]}</div>; })}</div>
        </div>

        <Breakdown title="This week" groups={weekGroups} total={weekEntries.length} serif={serif} />

        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-stone-300">
            <div className="text-xs text-stone-500 uppercase tracking-widest">the ledger</div>
            {entries.length > 0 && <div className="text-xs text-stone-400 tabular-nums">{entries.length} {entries.length === 1 ? "entry" : "entries"}</div>}
          </div>

          {entries.length === 0 ? <div className="text-sm text-stone-400 italic py-10 text-center" style={{ fontFamily: serif }}>nothing yet. begin your first five.</div> : (
            <div>
              {entries.slice(0, 50).map((entry, i) => {
                const isEditing = editingId === entry.id;
                const tags = parseTags(entry.note);
                return (
                  <div key={entry.id} className={`flex items-start gap-3 py-3 border-b border-stone-200 ${!isEditing ? "cursor-pointer hover:bg-stone-100" : ""} transition-colors`} onClick={() => !isEditing && (setEditingId(entry.id), setEditDraft(entry.note || ""))}>
                    <div className="text-xs text-stone-400 tabular-nums pt-1 flex-shrink-0" style={{ fontFamily: serif, width: "44px" }}>{entryNumber(i)}</div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? <input type="text" value={editDraft} onChange={(e) => setEditDraft(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitEdit(); } if (e.key === "Escape") { setEditingId(null); setEditDraft(""); } }} placeholder="tags, comma-separated" autoFocus className="w-full bg-transparent border-b border-amber-700 text-sm text-stone-900 focus:outline-none pb-0.5" /> : (
                        <div className="text-sm text-stone-900 break-words leading-snug">{tags.length > 0 ? <span className="flex flex-wrap gap-1.5">{tags.map((t) => <span key={t} className="inline-block bg-stone-100 text-stone-800 px-2 py-0.5 text-xs" style={{ borderRadius: "999px" }}>{t}</span>)}</span> : <span className="text-stone-400 italic" style={{ fontFamily: serif }}>— untitled · tap to tag</span>}</div>
                      )}
                      <div className="text-xs text-stone-400 mt-1 tabular-nums">{formatTimeAgo(entry.timestamp)}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} className="text-stone-300 hover:text-stone-700 text-lg leading-none pt-1 flex-shrink-0" aria-label="delete entry">×</button>
                  </div>
                );
              })}
              {entries.length > 50 && <div className="text-xs text-stone-400 text-center py-4 italic" style={{ fontFamily: serif }}>+ {entries.length - 50} earlier entries</div>}
            </div>
          )}
        </div>

        {entries.length > 0 && <div className="text-center pt-4 border-t border-stone-200">{!confirmClear ? <button onClick={() => setConfirmClear(true)} className="text-xs text-stone-400 hover:text-stone-700 tracking-wide">clear all entries</button> : <div className="flex items-center justify-center gap-3 text-xs"><span className="text-stone-600">clear everything?</span><button onClick={clearAll} className="text-red-700 hover:text-red-900 font-medium">yes, clear</button><button onClick={() => setConfirmClear(false)} className="text-stone-500 hover:text-stone-900">cancel</button></div>}</div>}
        <div className="text-center mt-8 text-xs text-stone-300 italic" style={{ fontFamily: serif }}>do one small thing. then another.</div>
      </div>
    </div>
  );
}

window.FiveApp.components = window.FiveApp.components || {};
window.FiveApp.components.FiveMinuteLog = FiveMinuteLog;
