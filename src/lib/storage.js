window.FiveApp = window.FiveApp || {};

const { CACHE_KEY, QUEUE_KEY } = window.FiveApp.constants;

const loadCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
  } catch (e) {
    return [];
  }
};

const saveCache = (entries) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch (e) {}
};

const loadQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch (e) {
    return [];
  }
};

const saveQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {}
};

window.FiveApp.storage = { loadCache, saveCache, loadQueue, saveQueue };
