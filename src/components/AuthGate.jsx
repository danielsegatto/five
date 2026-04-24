window.FiveApp = window.FiveApp || {};

function AuthGate() {
  const { useState } = React;
  const { supa } = window.FiveApp.config;

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const serif = "ui-serif, Georgia, serif";

  const submit = async () => {
    if (!email.trim() || !password) return;
    if (mode === "signup" && password.length < 6) {
      setError("password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "signin") {
        const { error } = await supa.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { error } = await supa.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (e) {
      setError((e.message || "something went wrong").toLowerCase());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex items-center justify-center px-5" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        input { font-size: 16px !important; }
        button, input { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
      `}</style>
      <div className="w-full max-w-sm">
        <h1 className="text-5xl italic tracking-tight mb-2" style={{ fontFamily: serif }}>Five.</h1>
        <div className="text-xs text-stone-400 tracking-widest uppercase mb-10">a logbook</div>
        <div className="text-sm text-stone-600 mb-5 leading-relaxed">
          {mode === "signin" ? "Sign in to your logbook." : "Create your logbook."}
        </div>
        <input
          type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off"
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email"
          className="w-full border border-stone-300 bg-white px-3 py-3 mb-3 focus:outline-none focus:border-amber-700"
          style={{ borderRadius: "2px" }}
        />
        <input
          type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="password"
          className="w-full border border-stone-300 bg-white px-3 py-3 mb-4 focus:outline-none focus:border-amber-700"
          style={{ borderRadius: "2px" }}
        />
        <button
          onClick={submit} disabled={submitting || !email.trim() || !password}
          className="w-full bg-stone-900 text-stone-50 py-3 text-sm tracking-wide hover:bg-stone-800 active:scale-95 transition-all disabled:opacity-40"
          style={{ borderRadius: "2px" }}
        >
          {submitting ? "…" : (mode === "signin" ? "Sign in" : "Create account")}
        </button>
        {error && <div className="mt-3 text-sm text-red-700">{error}</div>}
        <div className="mt-8 text-center">
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="text-xs text-stone-500 hover:text-stone-900 tracking-wide">
            {mode === "signin" ? "first time? create an account" : "already have an account? sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

window.FiveApp.components = window.FiveApp.components || {};
window.FiveApp.components.AuthGate = AuthGate;
