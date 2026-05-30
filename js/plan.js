// Loads the training programme and exposes helpers to resolve sessions and dates.
import { todayISO, parseISO } from './util.js';

let _plan = null;

export async function loadPlan() {
  if (_plan) return _plan;
  const res = await fetch('data/plan.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load plan.json (${res.status})`);
  _plan = await res.json();
  return _plan;
}

// Flatten all scheduled days across weeks, attaching the parent week object.
export function allDays(plan) {
  const out = [];
  for (const wk of plan.weeks) {
    for (const day of wk.days) out.push({ ...day, week: wk.week, wc: wk.wc });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// All days that involve actual training (used for stats / reminders).
export function trainingDays(plan) {
  return allDays(plan).filter((d) => d.components && d.components.length > 0);
}

export function dayByDate(plan, iso) {
  return allDays(plan).find((d) => d.date === iso) || null;
}

// Resolve a library reference like "mobility", "runs.run1b" or "gym.lowers1".
export function resolveRef(plan, ref) {
  const parts = ref.split('.');
  let node = plan.library;
  for (const p of parts) {
    if (!node) return null;
    node = node[p];
  }
  return node || null;
}

// What should "today" show? Returns { state, day }.
// state: 'training' (a scheduled day today), 'rest-today' (off/recovery-empty today),
// 'before' (programme not started), 'between' (gap day), 'after' (finished).
export function resolveToday(plan, iso = todayISO()) {
  const days = allDays(plan);
  if (!days.length) return { state: 'after', day: null };

  const exact = days.find((d) => d.date === iso);
  if (exact) return { state: 'training', day: exact };

  const first = days[0].date;
  const last = days[days.length - 1].date;
  if (iso < first) return { state: 'before', day: days[0] };
  if (iso > last) return { state: 'after', day: null };

  // In-range but not a scheduled day (e.g. a gap) — treat as a rest day,
  // and surface the next upcoming session.
  const next = days.find((d) => d.date > iso) || null;
  return { state: 'between', day: next };
}

// Build a stable id for a day (used as the progress key).
export function dayId(day) { return day.date; }

// Type metadata for a given day type code.
export function typeInfo(plan, type) {
  return (plan.dayTypes && plan.dayTypes[type]) || { label: type, colour: '#999', blurb: '' };
}

export function rpeColour(plan, rpe) {
  if (!rpe) return '#9aa0a6';
  const hit = (plan.rpeScale || []).find((r) => r.range === rpe);
  return hit ? hit.colour : '#9aa0a6';
}

export { parseISO };
