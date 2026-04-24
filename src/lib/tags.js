window.FiveApp = window.FiveApp || {};

const parseTags = (raw) => {
  if (!raw) return [];
  const out = (raw || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(out)];
};

const tagsToNote = (tags) => tags.join(", ");

window.FiveApp.tags = { parseTags, tagsToNote };
