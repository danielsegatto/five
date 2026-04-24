window.FiveApp = window.FiveApp || {};

const formatTimeAgo = (ts) => {
  const diff = Date.now() - ts;
  const mm = Math.floor(diff / 60000);
  if (mm < 1) return "just now";
  if (mm < 60) return `${mm}m ago`;
  const hh = Math.floor(mm / 60);
  if (hh < 24) return `${hh}h ago`;
  const dd = Math.floor(hh / 24);
  if (dd < 7) return `${dd}d ago`;
  const date = new Date(ts);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

window.FiveApp.format = { formatTimeAgo };
