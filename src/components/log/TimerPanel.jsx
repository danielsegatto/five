window.FiveApp = window.FiveApp || {};
window.FiveApp.logComponents = window.FiveApp.logComponents || {};

function TimerPanel({
  showTimer,
  setShowTimer,
  justLogged,
  totalCount,
  serif,
  m,
  s,
  progress,
  running,
  timeLeft,
  DURATION,
  startTimer,
  resetTimer,
  pauseTimer,
  setJustLogged,
}) {
  return (
    <>
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
    </>
  );
}

window.FiveApp.logComponents.TimerPanel = TimerPanel;
