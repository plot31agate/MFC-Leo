// Smart in-app nudges: read the time of day + Leo's progress and surface a
// short, motivating prompt (protein pacing / session tracking).
import { resolveToday, resolveRef } from '../plan.js';
import { proteinTotal, taskCount } from '../storage.js';

// Expected protein fraction across a day, ramped from ~08:00 to ~21:00.
const DAY_START_MIN = 8 * 60;
const DAY_END_MIN = 21 * 60;

function expectedFraction(now) {
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins <= DAY_START_MIN) return 0;
  if (mins >= DAY_END_MIN) return 1;
  return (mins - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN);
}

// Returns a prioritised list of { tone, text } (tone: 'warn' | 'info' | 'good').
export function computeNudges(plan, iso, now = new Date()) {
  const out = [];
  const target = plan.proteinTargetG || 140;
  const total = proteinTotal(iso);
  const hour = now.getHours();

  const { state, day } = resolveToday(plan, iso);
  const isTraining = state === 'training' && day && day.components && day.components.length && day.type !== 'preseason';
  const tc = isTraining ? taskCount(iso, day.components) : { done: 0, total: 0, all: false };

  // --- Protein pacing ---
  const expected = expectedFraction(now) * target;
  const remaining = Math.max(target - total, 0);
  const proteinHit = total >= target;
  if (!proteinHit && total + 12 < expected && hour >= 9) {
    const food = remaining >= 30 ? 'a shake or a proper meal' : 'a snack — milk, yoghurt or nuts';
    out.push({ tone: 'warn', icon: '🥤', text: `Behind on protein — you're at <b>${total}/${target}g</b>. Grab ${food}.` });
  } else if (!proteinHit && hour >= 19) {
    out.push({ tone: 'warn', icon: '🥤', text: `<b>${remaining}g</b> of protein left to hit ${target}g before bed — a shake will do it.` });
  }

  // --- Session tracking (training days only) ---
  if (isTraining && !tc.all && hour >= 16) {
    out.push({
      tone: 'info', icon: '⚽',
      text: tc.done === 0
        ? "You haven't tracked today's session yet — tick it off as you go."
        : `Session not finished — <b>${tc.done}/${tc.total}</b> done. Keep going!`,
    });
  }

  // --- Positive reinforcement late in the day ---
  if (proteinHit && (!isTraining || tc.all) && hour >= 17) {
    out.unshift({ tone: 'good', icon: '✅', text: 'Great day — protein hit and everything logged. Recover well!' });
  }

  return out.slice(0, 2);
}

// Render nudges into a container element. Re-callable after protein/task changes.
export function paintNudges(el, ctx, iso, now = new Date()) {
  if (!el) return;
  const nudges = computeNudges(ctx.plan, iso, now);
  el.innerHTML = nudges.map((n) =>
    `<div class="nudge nudge--${n.tone}"><span class="nudge__icon">${n.icon}</span><span class="nudge__text">${n.text}</span></div>`
  ).join('');
}
