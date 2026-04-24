window.FiveApp = window.FiveApp || {};

function FiveMinuteLog({ session, onSignOut, darkMode, toggleTheme }) {
  const { useState, useEffect, useMemo, useRef } = React;
  const { DURATION } = window.FiveApp.constants;
  const { parseTags, tagsToNote } = window.FiveApp.tags;
  const { loadCache, saveCache, loadQueue, saveQueue } = window.FiveApp.storage;
  const { formatTimeAgo } = window.FiveApp.format;
  const { supa } = window.FiveApp.config;
  const { Principles } = window.FiveApp.components;

  const [view, setView] = useState("log");
  const [entries, setEntries] = useState(() => loadCache());
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState("idle");
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [showTimer, setShowTimer] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const intervalRef = useRef(null);
  const wakeLockRef = useRef(null);
  const userId = session.user.id;

  useEffect(() => { saveCache(entries); }, [entries]);

  const pullFromServer = async () => {
    setSyncState("syncing");
    try {
      const { data, error } = await supa.from("entries").select("*").eq("user_id", userId).order("timestamp", { ascending: false });
      if (error) throw error;
      setEntries(data.map((r) => ({ id: Number(r.id), timestamp: Number(r.timestamp), note: r.note || "" })));
      setSyncState("idle");
    } catch (e) {
      setSyncState(navigator.onLine ? "error" : "offline");
    }
  };

  const enqueue = (op) => {
    const queue = loadQueue();
    queue.push(op);
    saveQueue(queue);
  };

  const flushQueue = async () => {
    if (!navigator.onLine) {
      setSyncState("offline");
      return;
    }

    const queue = loadQueue();
    if (queue.length === 0) return;

    setSyncState("syncing");
    try {
      for (const op of queue) {
        if (op.type === "insert") {
          await supa.from("entries").insert({ id: op.id, user_id: userId, timestamp: op.timestamp, note: op.note || "" });
        } else if (op.type === "update") {
          await supa.from("entries").update({ note: op.note || "" }).eq("id", op.id).eq("user_id", userId);
        } else if (op.type === "delete") {
          await supa.from("entries").delete().eq("id", op.id).eq("user_id", userId);
        } else if (op.type === "clear") {
          await supa.from("entries").delete().eq("user_id", userId);
        }
      }

      saveQueue([]);
      setSyncState("idle");
    } catch (e) {
      setSyncState("error");
    }
  };

  useEffect(() => { (async () => { await flushQueue(); await pullFromServer(); setLoading(false); })(); }, []);

  useEffect(() => {
    const ch = supa.channel("entries-" + userId)
      .on("postgres_changes", { event: "*", schema: "public", table: "entries", filter: `user_id=eq.${userId}` }, () => pullFromServer())
      .subscribe();

    return () => { supa.removeChannel(ch); };
  }, [userId]);

  useEffect(() => {
    const onOnline = () => flushQueue().then(() => pullFromServer());
    const onOffline = () => setSyncState("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (!navigator.onLine) setSyncState("offline");
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const acquireWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch (e) {}
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (e) {}
  };

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && running) acquireWakeLock();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [running]);

  const toggleTag = (tag) => {
    const norm = parseTags(tag)[0];
    if (!norm) return;
    setSelectedTags((prev) => prev.includes(norm) ? prev.filter((t) => t !== norm) : [...prev, norm]);
  };

  const addFromInput = () => {
    const tags = parseTags(tagInput);
    if (tags.length === 0) return;
    setSelectedTags((prev) => {
      const merged = [...prev];
      for (const t of tags) if (!merged.includes(t)) merged.push(t);
      return merged;
    });
    setTagInput("");
  };

  const clearCompose = () => {
    setSelectedTags([]);
    setTagInput("");
  };

  const composeFinalTags = () => {
    const pending = parseTags(tagInput);
    const out = [...selectedTags];
    for (const t of pending) if (!out.includes(t)) out.push(t);
    return out;
  };

  const createEntry = () => {
    const finalTags = composeFinalTags();
    const note = tagsToNote(finalTags);
    return { entry: { id: Date.now(), timestamp: Date.now(), note }, finalTags, note };
  };

  const logComposed = async () => {
    const { entry, finalTags, note } = createEntry();
    setEntries((prev) => [entry, ...prev]);
    enqueue({ type: "insert", id: entry.id, timestamp: entry.timestamp, note });
    setSelectedTags(finalTags);
    setTagInput("");
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
    flushQueue();
  };

  const autoLog = async () => {
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
  };

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setRunning(false);
            autoLog();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [running]);

  const startTimer = () => { setJustLogged(false); setTimeLeft(DURATION); setRunning(true); acquireWakeLock(); };
  const pauseTimer = () => { setRunning(false); releaseWakeLock(); };
  const resetTimer = () => { setRunning(false); setTimeLeft(DURATION); setJustLogged(false); releaseWakeLock(); };

  const beginEdit = (entry) => { setEditingId(entry.id); setEditDraft(entry.note || ""); };
  const commitEdit = async () => {
    if (editingId == null) return;
    const note = tagsToNote(parseTags(editDraft));
    setEntries((prev) => prev.map((e) => e.id === editingId ? { ...e, note } : e));
    enqueue({ type: "update", id: editingId, note });
    setEditingId(null);
    setEditDraft("");
    flushQueue();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const deleteEntry = async (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    enqueue({ type: "delete", id });
    if (editingId === id) cancelEdit();
    flushQueue();
  };

  const clearAll = async () => {
    setEntries([]);
    enqueue({ type: "clear" });
    setConfirmClear(false);
    flushQueue();
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const groupByTag = (items) => {
    const groups = new Map();
    for (const e of items) {
      const tags = parseTags(e.note);
      if (tags.length === 0) {
        const key = "__untitled";
        if (!groups.has(key)) groups.set(key, { key, label: null, count: 0 });
        groups.get(key).count++;
      } else {
        for (const t of tags) {
          if (!groups.has(t)) groups.set(t, { key: t, label: t, count: 0 });
          groups.get(t).count++;
        }
      }
    }
    return [...groups.values()].sort((a, b) => b.count - a.count);
  };

  const todayEntries = entries.filter((e) => e.timestamp >= todayStart.getTime());
  const weekEntries = entries.filter((e) => e.timestamp >= weekStart.getTime());
  const todayGroups = useMemo(() => groupByTag(todayEntries), [entries]);
  const weekGroups = useMemo(() => groupByTag(weekEntries), [entries]);

  const topTags = useMemo(() => {
    const counts = new Map();
    for (const e of entries) for (const t of parseTags(e.note)) counts.set(t, (counts.get(t) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([tag, count]) => ({ tag, count }));
  }, [entries]);

  const todayCount = todayEntries.length;
  const totalCount = entries.length;
  const totalMinutes = totalCount * 5;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = d.getTime() + 24 * 60 * 60 * 1000;
    const count = entries.filter((e) => e.timestamp >= d.getTime() && e.timestamp < next).length;
    last7.push({ date: new Date(d), count });
  }

  const maxCount = Math.max(1, ...last7.map((d) => d.count));
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

  const Breakdown = ({ title, groups, total }) => {
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
  };

  const syncBadge = {
    idle: { dot: "bg-green-600", text: "synced" },
    syncing: { dot: "bg-amber-500 animate-pulse", text: "syncing…" },
    offline: { dot: "bg-stone-400", text: "offline" },
    error: { dot: "bg-red-600", text: "sync error" },
  }[syncState];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm italic" style={{ fontFamily: serif }}>opening the ledger…</div>
      </div>
    );
  }

  if (view === "principles") return <Principles onBack={() => setView("log")} />;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <style>{`
        input, textarea, select { font-size: 16px !important; }
        button, input, textarea, [role="button"] { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
      `}</style>
      <div className="max-w-md mx-auto px-5 py-6">
        <div className="flex items-baseline justify-between mb-2">
          <h1 className="text-3xl italic tracking-tight" style={{ fontFamily: serif }}>Five.</h1>
          <button onClick={() => setView("principles")} className="text-xs text-stone-400 hover:text-stone-900 tracking-widest uppercase">principles · a logbook</button>
        </div>
        <div className="flex items-center justify-between mb-6 text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${syncBadge.dot}`}></span>
            <span>{syncBadge.text}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="text-stone-400 hover:text-stone-700 tracking-wide">{darkMode ? "light" : "dark"}</button>
            <button onClick={onSignOut} className="text-stone-400 hover:text-stone-700 tracking-wide">sign out</button>
          </div>
        </div>

        <div className="mb-4">
          <button onClick={logComposed} className="w-full bg-stone-900 text-stone-50 py-5 text-base tracking-wide hover:bg-stone-800 active:scale-95 transition-all" style={{ borderRadius: "2px" }}>
            {logLabel}
          </button>
        </div>

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

        <div className="mb-6 text-center">
          <button onClick={() => setShowTimer(!showTimer)} className="text-xs text-stone-500 hover:text-stone-900 tracking-wide">{showTimer ? "▴ hide in-app timer" : "▾ use the in-app timer"}</button>
        </div>

        {showTimer && (
          <div className={`mb-8 border p-6 text-center transition-colors ${justLogged ? "bg-amber-50 border-amber-200" : "bg-white border-stone-300"}`} style={{ borderRadius: "2px" }}>
            {justLogged ? (
              <>
                <div className="text-2xl italic text-amber-900 mb-1" style={{ fontFamily: serif }}>five. logged.</div>
                <div className="text-xs text-stone-500 mb-5">#{String(totalCount).padStart(4, "0")}</div>
                <button onClick={startTimer} className="w-full bg-stone-900 text-stone-50 py-3 text-sm tracking-wide hover:bg-stone-800 active:scale-95 transition-all" style={{ borderRadius: "2px" }}>Begin another five →</button>
                <button onClick={() => setJustLogged(false)} className="mt-3 text-xs text-stone-500 hover:text-stone-900">done for now</button>
              </>
            ) : (
              <>
                <div className="tabular-nums tracking-tight text-stone-900 mb-4" style={{ fontFamily: serif, fontSize: "56px", lineHeight: 1 }}>{m}:{String(s).padStart(2, "0")}</div>
                <div className="h-px bg-stone-200 mb-5 relative overflow-hidden"><div className="absolute left-0 top-0 h-full bg-amber-700 transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} /></div>
                {!running ? (
                  <>
                    <button onClick={startTimer} className="w-full bg-stone-900 text-stone-50 py-3 text-sm tracking-wide hover:bg-stone-800 active:scale-95 transition-all" style={{ borderRadius: "2px" }}>{timeLeft === DURATION ? "Begin five" : "Resume"}</button>
                    {timeLeft !== DURATION && <button onClick={resetTimer} className="mt-2 text-xs text-stone-500 hover:text-stone-900">reset</button>}
                  </>
                ) : (
                  <button onClick={pauseTimer} className="w-full border border-stone-300 text-stone-900 py-3 text-sm tracking-wide hover:bg-stone-100 active:scale-95 transition-all" style={{ borderRadius: "2px" }}>Pause</button>
                )}
                <div className="mt-3 text-xs text-stone-400 italic" style={{ fontFamily: serif }}>keeps the screen on while it runs</div>
              </>
            )}
          </div>
        )}

        <Breakdown title="Today" groups={todayGroups} total={todayCount} />

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
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5" style={{ height: "64px" }}>
                  <div className="text-xs text-stone-500 tabular-nums" style={{ fontFamily: serif, minHeight: "14px" }}>{d.count > 0 ? d.count : ""}</div>
                  <div className={`w-full rounded-sm ${isToday ? "bg-amber-700" : "bg-stone-300"}`} style={{ height: `${h}px` }} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-2 mt-2">
            {last7.map((d, i) => {
              const isToday = i === 6;
              return <div key={i} className={`flex-1 text-center text-xs tracking-wide ${isToday ? "text-amber-700 font-medium" : "text-stone-400"}`}>{["S", "M", "T", "W", "T", "F", "S"][d.date.getDay()]}</div>;
            })}
          </div>
        </div>

        <Breakdown title="This week" groups={weekGroups} total={weekEntries.length} />

        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-stone-300">
            <div className="text-xs text-stone-500 uppercase tracking-widest">the ledger</div>
            {entries.length > 0 && <div className="text-xs text-stone-400 tabular-nums">{entries.length} {entries.length === 1 ? "entry" : "entries"}</div>}
          </div>

          {entries.length === 0 ? (
            <div className="text-sm text-stone-400 italic py-10 text-center" style={{ fontFamily: serif }}>nothing yet. begin your first five.</div>
          ) : (
            <div>
              {entries.slice(0, 50).map((entry, i) => {
                const isEditing = editingId === entry.id;
                const tags = parseTags(entry.note);
                return (
                  <div key={entry.id} className={`flex items-start gap-3 py-3 border-b border-stone-200 ${!isEditing ? "cursor-pointer hover:bg-stone-100" : ""} transition-colors`} onClick={() => !isEditing && beginEdit(entry)}>
                    <div className="text-xs text-stone-400 tabular-nums pt-1 flex-shrink-0" style={{ fontFamily: serif, width: "44px" }}>{entryNumber(i)}</div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input type="text" value={editDraft} onChange={(e) => setEditDraft(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitEdit(); } if (e.key === "Escape") cancelEdit(); }} placeholder="tags, comma-separated" autoFocus className="w-full bg-transparent border-b border-amber-700 text-sm text-stone-900 focus:outline-none pb-0.5" />
                      ) : (
                        <div className="text-sm text-stone-900 break-words leading-snug">
                          {tags.length > 0 ? (
                            <span className="flex flex-wrap gap-1.5">{tags.map((t) => <span key={t} className="inline-block bg-stone-100 text-stone-800 px-2 py-0.5 text-xs" style={{ borderRadius: "999px" }}>{t}</span>)}</span>
                          ) : (
                            <span className="text-stone-400 italic" style={{ fontFamily: serif }}>— untitled · tap to tag</span>
                          )}
                        </div>
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

        {entries.length > 0 && (
          <div className="text-center pt-4 border-t border-stone-200">
            {!confirmClear ? (
              <button onClick={() => setConfirmClear(true)} className="text-xs text-stone-400 hover:text-stone-700 tracking-wide">clear all entries</button>
            ) : (
              <div className="flex items-center justify-center gap-3 text-xs">
                <span className="text-stone-600">clear everything?</span>
                <button onClick={clearAll} className="text-red-700 hover:text-red-900 font-medium">yes, clear</button>
                <button onClick={() => setConfirmClear(false)} className="text-stone-500 hover:text-stone-900">cancel</button>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-8 text-xs text-stone-300 italic" style={{ fontFamily: serif }}>do one small thing. then another.</div>
      </div>
    </div>
  );
}

window.FiveApp.components = window.FiveApp.components || {};
window.FiveApp.components.FiveMinuteLog = FiveMinuteLog;
