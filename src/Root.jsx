window.FiveApp = window.FiveApp || {};

function Root() {
  const { useState, useEffect } = React;
  const { configured, supa } = window.FiveApp.config;
  const { CACHE_KEY, QUEUE_KEY } = window.FiveApp.constants;
  const { SetupNeeded, AuthGate, FiveMinuteLog } = window.FiveApp.components;

  const [session, setSession] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('five_theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#1c1917');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#fafaf9');
    }
    localStorage.setItem('five_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  useEffect(() => {
    if (!configured) {
      setCheckingAuth(false);
      return;
    }

    supa.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingAuth(false);
    });

    const { data: listener } = supa.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!configured) return <SetupNeeded />;
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm italic" style={{ fontFamily: "ui-serif, Georgia, serif" }}>…</div>
      </div>
    );
  }

  if (!session) return <AuthGate />;

  return (
    <FiveMinuteLog
      session={session}
      darkMode={darkMode}
      toggleTheme={toggleTheme}
      onSignOut={async () => {
        await supa.auth.signOut();
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(QUEUE_KEY);
      }}
    />
  );
}

window.FiveApp.Root = Root;
