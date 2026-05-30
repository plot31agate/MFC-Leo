// Local-only persistence: completion, notes, metrics and settings.
// Everything lives in localStorage on Leo's phone. No server, no accounts.
import { trainingDays } from './plan.js';
import { todayISO, daysBetween } from './util.js';

const PROGRESS_KEY = 'mfc.progress.v1';
const SETTINGS_KEY = 'mfc.settings.v1';

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function writeJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ---- Progress (keyed by day date) ----
export function getProgress() { return readJSON(PROGRESS_KEY, {}); }
export function getDay(dateIso) { return getProgress()[dateIso] || {}; }

export function setDayDone(dateIso, done) {
  const all = getProgress();
  const rec = all[dateIso] || {};
  rec.done = !!done;
  rec.completedAt = done ? new Date().toISOString() : null;
  all[dateIso] = rec;
  writeJSON(PROGRESS_KEY, all);
  return rec;
}

export function setDayField(dateIso, field, value) {
  const all = getProgress();
  const rec = all[dateIso] || {};
  rec[field] = value;
  all[dateIso] = rec;
  writeJSON(PROGRESS_KEY, all);
  return rec;
}

// ---- Settings ----
export function getSettings() {
  return Object.assign({ reminderTime: '09:00', reminderLeadMin: 60 }, readJSON(SETTINGS_KEY, {}));
}
export function setSetting(key, value) {
  const s = getSettings();
  s[key] = value;
  writeJSON(SETTINGS_KEY, s);
  return s;
}

// ---- Derived stats ----
export function stats(plan) {
  const days = trainingDays(plan);
  const prog = getProgress();
  const doneDates = days.filter((d) => prog[d.date]?.done).map((d) => d.date);
  const total = days.length;
  const done = doneDates.length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  // Per-week completion
  const byWeek = {};
  for (const d of days) {
    byWeek[d.week] = byWeek[d.week] || { total: 0, done: 0 };
    byWeek[d.week].total++;
    if (prog[d.date]?.done) byWeek[d.week].done++;
  }

  // Current streak: consecutive *training* days up to today that are done.
  const today = todayISO();
  const past = days.filter((d) => d.date <= today).sort((a, b) => (a.date < b.date ? 1 : -1));
  let streak = 0;
  for (const d of past) {
    if (prog[d.date]?.done) streak++;
    else break;
  }

  // 5km PB (lowest recorded time, stored as "mm:ss")
  let pb = null;
  for (const d of days) {
    const t = prog[d.date]?.metrics?.fiveK;
    if (t && /^\d{1,2}:\d{2}$/.test(t)) {
      const secs = toSecs(t);
      if (pb === null || secs < pb.secs) pb = { secs, display: t, date: d.date };
    }
  }

  return { total, done, percent, byWeek, streak, pb };
}

function toSecs(mmss) {
  const [m, s] = mmss.split(':').map(Number);
  return m * 60 + s;
}

// ---- Backup / restore ----
export function exportData() {
  return JSON.stringify({
    app: 'mfc-leo',
    exportedAt: new Date().toISOString(),
    progress: getProgress(),
    settings: getSettings(),
  }, null, 2);
}

export function importData(json) {
  const data = JSON.parse(json);
  if (data.progress) writeJSON(PROGRESS_KEY, data.progress);
  if (data.settings) writeJSON(SETTINGS_KEY, data.settings);
}

export { daysBetween };
