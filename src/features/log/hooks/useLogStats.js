window.FiveApp = window.FiveApp || {};
window.FiveApp.logHooks = window.FiveApp.logHooks || {};

function useLogStats({ entries, parseTags }) {
  const { useMemo } = React;

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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const todayEntries = entries.filter((e) => e.timestamp >= todayStart.getTime());
  const weekEntries = entries.filter((e) => e.timestamp >= weekStart.getTime());

  const todayGroups = useMemo(() => groupByTag(todayEntries), [entries]);
  const weekGroups = useMemo(() => groupByTag(weekEntries), [entries]);

  const topTags = useMemo(() => {
    const counts = new Map();
    for (const e of entries) for (const t of parseTags(e.note)) counts.set(t, (counts.get(t) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([tag, count]) => ({ tag, count }));
  }, [entries]);

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = d.getTime() + 24 * 60 * 60 * 1000;
    const count = entries.filter((e) => e.timestamp >= d.getTime() && e.timestamp < next).length;
    last7.push({ date: new Date(d), count });
  }

  const todayCount = todayEntries.length;
  const totalCount = entries.length;
  const totalMinutes = totalCount * 5;

  return {
    todayCount,
    totalCount,
    totalMinutes,
    weekEntries,
    todayGroups,
    weekGroups,
    topTags,
    last7,
    maxCount: Math.max(1, ...last7.map((d) => d.count)),
  };
}

window.FiveApp.logHooks.useLogStats = useLogStats;
