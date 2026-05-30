// The home screen: what Leo should do today.
import { resolveToday, resolveRef, typeInfo, rpeColour } from '../plan.js';
import { getDay, setDayDone, setDayField } from '../storage.js';
import { todayISO, prettyDate, parseISO, daysBetween, DOW_LONG, MONTHS } from '../util.js';
import { componentHTML } from './components.js';
import { esc } from '../util.js';

export function renderToday(container, ctx) {
  const { plan } = ctx;
  const iso = todayISO();
  const { state, day } = resolveToday(plan, iso);

  if (state === 'before') return restCard(container, ctx, `Programme starts ${prettyDate(day.date)}`,
    `${daysBetween(iso, day.date)} day(s) to go. Enjoy your rest and recover well. 🌴`);

  if (state === 'after') return preseasonCard(container, ctx);

  // 'training' (exact date) or 'between' (gap day → show next session preview)
  if (state === 'between') {
    return restCard(container, ctx, 'Rest day', 'Nothing scheduled today — recover well.',
      day ? { label: `Next: ${typeInfo(plan, day.type).label}`, date: day.date } : null);
  }

  // Exact day match
  if (day.type === 'preseason') return preseasonCard(container, ctx, day);
  if (!day.components || day.components.length === 0) {
    return restCard(container, ctx, 'Day Off', typeInfo(plan, day.type).blurb || 'Rest day — take it. Recovery is part of the plan. 😴');
  }

  // ---- A real training day ----
  const info = typeInfo(plan, day.type);
  const rec = getDay(day.date);
  const d = parseISO(day.date);
  const hasRun = day.components.some((r) => r.startsWith('runs.'));
  const benchmark = day.components.includes('runs.benchmark5k');

  const comps = day.components.map((ref, i) => {
    const node = resolveRef(plan, ref);
    if (!node) return '';
    return componentHTML(node, i + 1, { week: String(day.week), open: false });
  }).join('');

  container.innerHTML = `
    <section class="card today-hero card--accent">
      <p class="date">${DOW_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}</p>
      <h2>${esc(day.title || info.label)}</h2>
      <p class="blurb">${esc(info.blurb)}</p>
      <div class="chips">
        <span class="chip chip--type">${esc(info.label)}</span>
        ${day.rpe ? `<span class="chip chip--rpe" style="background:${rpeColour(plan, day.rpe)}">RPE ${esc(day.rpe)}</span>` : ''}
      </div>
    </section>

    ${rec.done ? `<div class="done-banner">✓ Completed — great work, Leo!</div>` : ''}

    ${hasRun ? `<p class="section-title">Session — do these in order</p>` : `<p class="section-title">Session</p>`}
    ${comps}

    ${nutritionBlock(plan)}

    <section class="card">
      ${benchmark ? `
        <label class="lbl" for="fivek">Log your 5km time (mm:ss)</label>
        <input class="field" id="fivek" inputmode="numeric" placeholder="e.g. 19:45" value="${esc(rec.metrics?.fiveK || '')}" />
      ` : ''}
      <label class="lbl" for="note">Notes (how it felt, weights used, Strava time…)</label>
      <textarea class="field" id="note" rows="3" placeholder="Optional">${esc(rec.notes || '')}</textarea>
      <div style="height:12px"></div>
      <button class="btn ${rec.done ? 'btn--ghost' : 'btn--done'}" id="toggle-done">
        ${rec.done ? 'Mark as not done' : '✓ Mark today as done'}
      </button>
    </section>

    <a class="btn btn--ghost btn--sm" style="margin-top:4px" href="${esc(plan.stravaTeamUrl || 'https://www.strava.com')}" target="_blank" rel="noopener">Log it on Strava ↗</a>
  `;

  // ---- wiring ----
  const noteEl = container.querySelector('#note');
  const fiveEl = container.querySelector('#fivek');
  noteEl?.addEventListener('change', () => setDayField(day.date, 'notes', noteEl.value.trim()));
  fiveEl?.addEventListener('change', () => {
    const metrics = getDay(day.date).metrics || {};
    metrics.fiveK = fiveEl.value.trim();
    setDayField(day.date, 'metrics', metrics);
  });
  container.querySelector('#toggle-done').addEventListener('click', () => {
    if (noteEl) setDayField(day.date, 'notes', noteEl.value.trim());
    if (fiveEl) { const m = getDay(day.date).metrics || {}; m.fiveK = fiveEl.value.trim(); setDayField(day.date, 'metrics', m); }
    setDayDone(day.date, !getDay(day.date).done);
    ctx.refresh();
  });
}

function nutritionBlock(plan) {
  const node = resolveRef(plan, 'nutrition');
  if (!node) return '';
  return `
    <p class="section-title">Fuel</p>
    ${componentHTML(node, null, { open: false })}`;
}

function restCard(container, ctx, title, body, next) {
  container.innerHTML = `
    <section class="card center card--accent">
      <div class="big-emoji">🛌</div>
      <h2>${esc(title)}</h2>
      <p class="muted">${esc(body)}</p>
    </section>
    ${next ? `<button class="btn btn--ghost" id="see-next">${esc(next.label)} · ${esc(prettyDate(next.date))}</button>` : ''}
    <button class="btn btn--primary" id="go-plan" style="margin-top:10px">See the full plan</button>
  `;
  container.querySelector('#go-plan').addEventListener('click', () => { location.hash = '#/plan'; });
  container.querySelector('#see-next')?.addEventListener('click', () => { location.hash = '#/plan'; });
}

function preseasonCard(container, ctx, day) {
  container.innerHTML = `
    <section class="card center card--accent">
      <div class="big-emoji">⚽</div>
      <h2>Pre-Season!</h2>
      <p class="muted">Players return for pre-season training. You've put the work in — go and show them, Leo. 💪</p>
    </section>
    <button class="btn btn--primary" id="go-progress">See your progress</button>
  `;
  container.querySelector('#go-progress').addEventListener('click', () => { location.hash = '#/progress'; });
}
