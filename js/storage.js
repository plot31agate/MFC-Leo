// Local-only persistence: completion, notes, metrics and settings.
// Everything lives in localStorage on this player's phone. No server, no accounts.
import { trainingDays } from './plan.js';
import { todayISO, daysBetween, isoDate } from './util.js';

const PROGRESS_KEY = 'mfc.progress.v1';
const SETTINGS_KEY = 'mfc.settings.v1';
const PROFILE_KEY = 'mfc.profile.v1';

// ---- Player profile (per phone) ----
// Each install belongs to one player. Name + protein target are theirs;
// the training plan itself is shared academy-wide.
export function getProfile() {
  return readJSON(PROFILE_KEY, null);
}
export function hasProfile() {
  const p = getProfile();
  return !!(p && p.name);
}
export function saveProfile(profile) {
  const clean = {
    name: String(profile.name || '').trim().slice(0, 40),
    proteinTargetG: Math.max(0, Math.round(Number(profile.proteinTargetG) || 0)) || null,
  };
  writeJSON(PROFILE_KEY, clean);
  return clean;
}
// The player's name, falling back to the plan default.
export function playerName(plan) {
  const p = getProfile();
  return (p && p.name) || (plan && (plan.athleteName || plan.athlete)) || 'Player';
}
// The player's protein target, falling back to the plan default.
export function proteinTarget(plan) {
  const p = getProfile();
  return (p && p.proteinTargetG) || (plan && plan.proteinTargetG) || 140;
}

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

// ---- Protein log (per day) ----
export function getProteinLog(dateIso) {
  return getDay(dateIso).protein || [];
}
export function proteinTotal(dateIso) {
  return getProteinLog(dateIso).reduce((s, e) => s + (Number(e.g) || 0), 0);
}
export function addProtein(dateIso, label, grams) {
  const log = getProteinLog(dateIso).slice();
  log.push({ label, g: Number(grams) || 0 });
  return setDayField(dateIso, 'protein', log);
}
export function removeProtein(dateIso, index) {
  const log = getProteinLog(dateIso).slice();
  log.splice(index, 1);
  return setDayField(dateIso, 'protein', log);
}
// Consecutive days (up to today) hitting the protein target. Today still counts
// as "in progress" — it won't break the streak until the day is over.
export function proteinStreak(target) {
  if (!target) return 0;
  const prog = getProgress();
  const base = new Date();
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const dt = new Date(base);
    dt.setDate(dt.getDate() - i);
    const total = (prog[isoDate(dt)]?.protein || []).reduce((s, e) => s + (Number(e.g) || 0), 0);
    if (total >= target) streak++;
    else if (i === 0) continue; // today not hit yet — don't break the streak
    else break;
  }
  return streak;
}

// ---- Per-task completion (keyed by component ref within a day) ----
export function getTasks(dateIso) {
  return getDay(dateIso).tasks || {};
}
export function setTask(dateIso, ref, done) {
  const tasks = Object.assign({}, getTasks(dateIso));
  if (done) tasks[ref] = true; else delete tasks[ref];
  return setDayField(dateIso, 'tasks', tasks);
}
// How many of the given component refs are ticked done.
export function taskCount(dateIso, refs) {
  const tasks = getTasks(dateIso);
  const done = refs.filter((r) => tasks[r]).length;
  return { done, total: refs.length, all: refs.length > 0 && done === refs.length };
}

// ---- Settings ----
export function getSettings() {
  return Object.assign({
    reminderTime: '09:00',
    reminderLeadMin: 60,
    mealReminderTimes: ['15:00', '18:00', '20:30'],
  }, readJSON(SETTINGS_KEY, {}));
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

  // Protein: how many days hit the daily target (per-player, falling back to plan).
  const target = proteinTarget(plan);
  let proteinDaysHit = 0;
  if (target) {
    for (const rec of Object.values(prog)) {
      const tot = (rec.protein || []).reduce((s, e) => s + (Number(e.g) || 0), 0);
      if (tot >= target) proteinDaysHit++;
    }
  }

  return { total, done, percent, byWeek, streak, pb, proteinDaysHit };
}

function toSecs(mmss) {
  const [m, s] = mmss.split(':').map(Number);
  return m * 60 + s;
}

// ---- Backup / restore ----
export function exportData() {
  return JSON.stringify({
    app: 'mfc-academy',
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    progress: getProgress(),
    settings: getSettings(),
  }, null, 2);
}

export function importData(json) {
  const data = JSON.parse(json);
  if (data.profile) writeJSON(PROFILE_KEY, data.profile);
  if (data.progress) writeJSON(PROGRESS_KEY, data.progress);
  if (data.settings) writeJSON(SETTINGS_KEY, data.settings);
}

export { daysBetween };
