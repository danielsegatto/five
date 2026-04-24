window.FiveApp = window.FiveApp || {};

function SetupNeeded() {
  const serif = "ui-serif, Georgia, serif";
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex items-center justify-center p-6" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div className="max-w-md">
        <h1 className="text-4xl italic tracking-tight mb-6" style={{ fontFamily: serif }}>Five.</h1>
        <div className="text-sm text-stone-700 leading-relaxed">
          <p><strong>Setup required.</strong> Open <code className="bg-stone-200 px-1">src/lib/config.js</code> and paste your Supabase URL and anon public key. See the README for the full walk-through.</p>
        </div>
      </div>
    </div>
  );
}

window.FiveApp.components = window.FiveApp.components || {};
window.FiveApp.components.SetupNeeded = SetupNeeded;
