// The home screen: a single, scannable look at today — protein target,
// the full session shown inline (nothing hidden behind taps), fuel, and logging.
import { resolveToday, resolveRef, typeInfo, rpeColour } from '../plan.js';
import {
  getDay, setDayDone, setDayField,
  getProteinLog, proteinTotal, addProtein, removeProtein,
} from '../storage.js';
import { todayISO, prettyDate, parseISO, daysBetween, DOW_LONG, MONTHS } from '../util.js';
import { componentCard } from './components.js';
import { esc } from '../util.js';

export function renderToday(container, ctx) {
  const { plan } = ctx;
  const iso = todayISO();
  const { state, day } = resolveToday(plan, iso);
  const d = parseISO(iso);
  const kicker = `TODAY · ${DOW_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  // Decide what kind of day this is.
  const exact = state === 'training' ? day : null;
  const isTraining = !!(exact && exact.components && exact.components.length && exact.type !== 'preseason');

  let hero, body = '';

  if (isTraining) {
    const info = typeInfo(plan, exact.type);
    const rec = getDay(exact.date);
    const benchmark = exact.components.includes('runs.benchmark5k');
    hero = heroHTML(kicker, exact.title || info.label, info.blurb, exact, plan,
      rec.done ? '✓ Completed — great work, Leo!' : '');

    const comps = exact.components.map((ref, i) => {
      const node = resolveRef(plan, ref);
      return node ? componentCard(node, i + 1, { week: String(exact.week) }) : '';
    }).join('');

    const nut = resolveRef(plan, 'nutrition');
    body = `
      ${proteinPlaceholder()}
      <h2 class="block-title">Your session <span class="block-title__hint">— work top to bottom</span></h2>
      ${comps}
      ${nut ? `<h2 class="block-title">Food &amp; fuel</h2>${componentCard(nut, null, {})}` : ''}
      <h2 class="block-title">Log it</h2>
      <section class="card">
        ${benchmark ? `
          <label class="lbl" for="fivek">Your 5km time (mm:ss)</label>
          <input class="field" id="fivek" inputmode="numeric" placeholder="e.g. 19:45" value="${esc(rec.metrics?.fiveK || '')}" />` : ''}
        <label class="lbl" for="note">Notes — how it felt, weights used, Strava time…</label>
        <textarea class="field" id="note" rows="3" placeholder="Optional">${esc(rec.notes || '')}</textarea>
        <button class="btn ${rec.done ? 'btn--ghost' : 'btn--done'} btn--big" id="toggle-done" style="margin-top:14px">
          ${rec.done ? 'Mark as not done' : '✓ Mark today as done'}
        </button>
      </section>
      <a class="btn btn--strava" href="${esc(plan.stravaTeamUrl || 'https://www.strava.com')}" target="_blank" rel="noopener">Log runs &amp; gym on Strava ↗</a>
    `;
    container.innerHTML = hero + body;

    // wiring
    mountProtein(container.querySelector('#protein-mount'), ctx, iso);
    const noteEl = container.querySelector('#note');
    const fiveEl = container.querySelector('#fivek');
    noteEl?.addEventListener('change', () => setDayField(exact.date, 'notes', noteEl.value.trim()));
    fiveEl?.addEventListener('change', () => {
      const m = getDay(exact.date).metrics || {}; m.fiveK = fiveEl.value.trim();
      setDayField(exact.date, 'metrics', m);
    });
    container.querySelector('#toggle-done').addEventListener('click', () => {
      if (noteEl) setDayField(exact.date, 'notes', noteEl.value.trim());
      if (fiveEl) { const m = getDay(exact.date).metrics || {}; m.fiveK = fiveEl.value.trim(); setDayField(exact.date, 'metrics', m); }
      setDayDone(exact.date, !getDay(exact.date).done);
      ctx.refresh();
    });
    return;
  }

  // ---- Non-training days (rest / off / before / after / pre-season) ----
  let title, blurb, emoji = '🛌';
  if (state === 'before') { title = 'Counting down'; blurb = `Programme starts ${prettyDate(day.date)} — ${daysBetween(iso, day.date)} day(s) to go. Rest up and recover. 🌴`; emoji = '🌴'; }
  else if (state === 'after') { title = 'Pre-Season!'; blurb = "Players have returned. You put the work in — go and show them, Leo. 💪"; emoji = '⚽'; }
  else if (exact && exact.type === 'preseason') { title = 'Pre-Season!'; blurb = 'Players return for pre-season training today. 💪'; emoji = '⚽'; }
  else if (state === 'between') { title = 'Rest day'; blurb = day ? `Nothing scheduled — recover well. Next up: ${typeInfo(plan, day.type).label} on ${prettyDate(day.date)}.` : 'Recover well.'; }
  else { title = exact && exact.type === 'off' ? 'Day Off' : 'Recovery'; blurb = (exact ? typeInfo(plan, exact.type).blurb : '') || 'Rest day — take it. Recovery is part of the plan.'; }

  hero = heroHTML(kicker, title, blurb, null, plan, '');
  container.innerHTML = `
    ${hero}
    ${proteinPlaceholder()}
    <section class="card center">
      <div class="big-emoji">${emoji}</div>
      <p class="muted">Still hit your <b>${plan.proteinTargetG || 140}g protein</b> today — recovery matters most on rest days.</p>
    </section>
    <button class="btn btn--primary btn--big" id="go-plan">See the full plan</button>
  `;
  mountProtein(container.querySelector('#protein-mount'), ctx, iso);
  container.querySelector('#go-plan').addEventListener('click', () => { location.hash = '#/plan'; });
}

// ---------- Hero ----------
function heroHTML(kicker, title, blurb, day, plan, banner) {
  const info = day ? typeInfo(plan, day.type) : null;
  return `
    <section class="hero">
      <p class="hero__kicker">${esc(kicker)}</p>
      <h1 class="hero__title">${esc(title)}</h1>
      <div class="hero__chips">
        ${info ? `<span class="chip chip--type">${esc(info.label)}</span>` : ''}
        ${day && day.rpe ? `<span class="chip chip--rpe" style="background:${rpeColour(plan, day.rpe)}">RPE ${esc(day.rpe)}</span>` : ''}
      </div>
      ${blurb ? `<p class="hero__blurb">${esc(blurb)}</p>` : ''}
    </section>
    ${banner ? `<div class="done-banner">${esc(banner)}</div>` : ''}`;
}

// ---------- Protein tracker ----------
function proteinPlaceholder() {
  return `<section class="card card--protein"><div id="protein-mount"></div></section>`;
}

function mountProtein(el, ctx, iso) {
  if (!el) return;
  const { plan } = ctx;
  const target = plan.proteinTargetG || 140;
  const log = getProteinLog(iso);
  const total = proteinTotal(iso);
  const pct = Math.min(total / target, 1);
  const C = 2 * Math.PI * 42;
  const offset = C * (1 - pct);
  const hit = total >= target;
  const remaining = Math.max(target - total, 0);

  el.innerHTML = `
    <div class="protein__top">
      <div class="ring">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle class="ring__bg" cx="50" cy="50" r="42"/>
          <circle class="ring__fg ${hit ? 'is-hit' : ''}" cx="50" cy="50" r="42"
            stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/>
        </svg>
        <div class="ring__label"><span class="ring__num">${total}</span><span class="ring__den">/ ${target}g</span></div>
      </div>
      <div class="protein__meta">
        <p class="protein__title">Protein today</p>
        <p class="protein__msg ${hit ? 'is-hit' : ''}">${hit ? '✅ Target smashed!' : `<b>${remaining}g</b> to go`}</p>
        <p class="protein__hint">Tap what you eat to count towards ${target}g</p>
      </div>
    </div>
    <div class="pchips">
      ${(plan.proteinFoods || []).map((f) => `<button class="pchip" data-add="${f.g}" data-label="${esc(f.label)}">${esc(f.label)} <b>+${f.g}</b></button>`).join('')}
      <button class="pchip pchip--alt" data-custom="1">+ Other</button>
    </div>
    <div class="pcustom" hidden>
      <input class="field" id="pc-g" inputmode="numeric" placeholder="grams of protein" />
      <button class="btn btn--sm btn--primary" id="pc-add">Add</button>
    </div>
    ${log.length ? `<ul class="plog">${log.map((e, i) => `<li><span>${esc(e.label)}</span><span class="plog__g">${e.g}g <button class="plog__x" data-rm="${i}" aria-label="Remove ${esc(e.label)}">×</button></span></li>`).join('')}</ul>` : ''}
  `;

  el.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => {
    addProtein(iso, b.dataset.label, Number(b.dataset.add));
    mountProtein(el, ctx, iso);
  }));
  el.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => {
    removeProtein(iso, Number(b.dataset.rm));
    mountProtein(el, ctx, iso);
  }));
  const customBtn = el.querySelector('[data-custom]');
  const customBox = el.querySelector('.pcustom');
  customBtn?.addEventListener('click', () => {
    customBox.hidden = !customBox.hidden;
    if (!customBox.hidden) el.querySelector('#pc-g').focus();
  });
  const addCustom = () => {
    const v = Number(el.querySelector('#pc-g').value);
    if (v > 0) { addProtein(iso, 'Other', v); mountProtein(el, ctx, iso); }
  };
  el.querySelector('#pc-add')?.addEventListener('click', addCustom);
  el.querySelector('#pc-g')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustom(); });
}
