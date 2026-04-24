window.FiveApp = window.FiveApp || {};
window.FiveApp.logHooks = window.FiveApp.logHooks || {};

function useTagComposer({ parseTags }) {
  const { useState } = React;
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

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

  return {
    selectedTags,
    setSelectedTags,
    tagInput,
    setTagInput,
    toggleTag,
    addFromInput,
    clearCompose,
    composeFinalTags,
  };
}

window.FiveApp.logHooks.useTagComposer = useTagComposer;
