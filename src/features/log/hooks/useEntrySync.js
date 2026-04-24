window.FiveApp = window.FiveApp || {};
window.FiveApp.logHooks = window.FiveApp.logHooks || {};

function useEntrySync({ userId, supa, loadCache, saveCache, loadQueue, saveQueue }) {
  const { useState, useEffect } = React;

  const [entries, setEntries] = useState(() => loadCache());
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState("idle");

  useEffect(() => {
    saveCache(entries);
  }, [entries]);

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

  useEffect(() => {
    (async () => {
      await flushQueue();
      await pullFromServer();
      setLoading(false);
    })();
  }, []);

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

  return { entries, setEntries, loading, syncState, enqueue, flushQueue, setSyncState };
}

window.FiveApp.logHooks.useEntrySync = useEntrySync;
