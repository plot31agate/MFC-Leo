// The home screen: session-led checklist with a compact protein strip,
// smart nudges, fuel and logging.
import { resolveToday, resolveRef, typeInfo, rpeColour } from '../plan.js';
import {
  getDay, setDayDone, setDayField,
  getProteinLog, proteinTotal, addProtein, removeProtein,
  getTasks, setTask, taskCount,
} from '../storage.js';
import { todayISO, prettyDate, parseISO, daysBetween, DOW_LONG, MONTHS } from '../util.js';
import { componentCard, componentHTML } from './components.js';
import { paintNudges } from './nudges.js';
import { esc } from '../util.js';

export function renderToday(container, ctx) {
  const { plan } = ctx;
  const iso = todayISO();
  const { state, day } = resolveToday(plan, iso);
  const d = parseISO(iso);
  const kicker = `TODAY · ${DOW_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  const exact = state === 'training' ? day : null;
  const isTraining = !!(exact && exact.components && exact.components.length && exact.type !== 'preseason');

  if (isTraining) {
    const info = typeInfo(plan, exact.type);
    const rec = getDay(exact.date);
    const tasks = getTasks(exact.date);
    const tc = taskCount(exact.date, exact.components);
    const benchmark = exact.components.includes('runs.benchmark5k');

    const comps = exact.components.map((ref, i) => {
      const node = resolveRef(plan, ref);
      return node ? componentCard(node, i + 1, { week: String(exact.week), ref, done: !!tasks[ref] }) : '';
    }).join('');

    const nut = resolveRef(plan, 'nutrition');

    container.innerHTML = `
      <div id="nudges"></div>
      ${heroHTML(kicker, exact.title || info.label, info.blurb, exact, plan, { done: tc.done, total: tc.total })}
      <div class="done-banner" id="done-banner" ${tc.all ? '' : 'hidden'}>✓ Completed — great work, Leo!</div>

      <div class="row-between" style="margin:20px 2px 10px">
        <h2 class="block-title" style="margin:0">Your session <span class="block-title__hint">— tick as you go</span></h2>
        <button class="link-btn" id="mark-all">${tc.all ? 'Reset' : 'Mark all'}</button>
      </div>
      ${comps}

      ${proteinPlaceholder('strip')}

      ${nut ? `<h2 class="block-title">Food &amp; fuel</h2>${componentHTML(nut, null, {})}` : ''}

      <h2 class="block-title">Log it</h2>
      <details class="comp">
        <summary class="comp__head"><span class="comp__title">Notes${benchmark ? ' &amp; 5km time' : ''}</span><span class="comp__chev">›</span></summary>
        <div class="comp__body">
          ${benchmark ? `
            <label class="lbl" for="fivek">Your 5km time (mm:ss)</label>
            <input class="field" id="fivek" inputmode="numeric" placeholder="e.g. 19:45" value="${esc(rec.metrics?.fiveK || '')}" />` : ''}
          <label class="lbl" for="note">Notes — how it felt, weights used, Strava time…</label>
          <textarea class="field" id="note" rows="3" placeholder="Optional">${esc(rec.notes || '')}</textarea>
        </div>
      </details>
      <a class="btn btn--strava" href="${esc(plan.stravaTeamUrl || 'https://www.strava.com')}" target="_blank" rel="noopener">Log runs &amp; gym on Strava ↗</a>
    `;

    mountProtein(container.querySelector('#protein-mount'), ctx, iso, 'strip');
    paintNudges(container.querySelector('#nudges'), ctx, iso);
    bindLog(container, exact.date);
    bindTasks(container, ctx, iso, exact.components);
    return;
  }

  // ---- Non-training days (protein stays prominent — no session competing) ----
  let title, blurb, emoji = '🛌';
  if (state === 'before') { title = 'Counting down'; blurb = `Programme starts ${prettyDate(day.date)} — ${daysBetween(iso, day.date)} day(s) to go. Rest up and recover. 🌴`; emoji = '🌴'; }
  else if (state === 'after') { title = 'Pre-Season!'; blurb = "Players have returned. You put the work in — go and show them, Leo. 💪"; emoji = '⚽'; }
  else if (exact && exact.type === 'preseason') { title = 'Pre-Season!'; blurb = 'Players return for pre-season training today. 💪'; emoji = '⚽'; }
  else if (state === 'between') { title = 'Rest day'; blurb = day ? `Nothing scheduled — recover well. Next up: ${typeInfo(plan, day.type).label} on ${prettyDate(day.date)}.` : 'Recover well.'; }
  else { title = exact && exact.type === 'off' ? 'Day Off' : 'Recovery'; blurb = (exact ? typeInfo(plan, exact.type).blurb : '') || 'Rest day — take it. Recovery is part of the plan.'; }

  container.innerHTML = `
    <div id="nudges"></div>
    ${heroHTML(kicker, title, blurb, null, plan, null)}
    ${proteinPlaceholder('full')}
    <section class="card center">
      <div class="big-emoji">${emoji}</div>
      <p class="muted">Recovery matters most on rest days — sleep well, eat well, and still hit your <b>${plan.proteinTargetG || 140}g protein</b>.</p>
    </section>
    <button class="btn btn--primary btn--big" id="go-plan">See the full plan</button>
  `;
  mountProtein(container.querySelector('#protein-mount'), ctx, iso, 'full');
  paintNudges(container.querySelector('#nudges'), ctx, iso);
  container.querySelector('#go-plan').addEventListener('click', () => { location.hash = '#/plan'; });
}

// ---------- Hero ----------
function heroHTML(kicker, title, blurb, day, plan, progress) {
  const info = day ? typeInfo(plan, day.type) : null;
  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return `
    <section class="hero">
      <p class="hero__kicker">${esc(kicker)}</p>
      <h1 class="hero__title">${esc(title)}</h1>
      <div class="hero__chips">
        ${info ? `<span class="chip chip--type">${esc(info.label)}</span>` : ''}
        ${day && day.rpe ? `<span class="chip chip--rpe" style="background:${rpeColour(plan, day.rpe)}">RPE ${esc(day.rpe)}</span>` : ''}
      </div>
      ${blurb ? `<p class="hero__blurb">${esc(blurb)}</p>` : ''}
      ${progress ? `
        <div class="hero__progress">
          <div class="hero__pbar"><span id="hero-pbar" style="width:${pct}%"></span></div>
          <span class="hero__pcount" id="hero-pcount">${progress.done}/${progress.total}</span>
        </div>` : ''}
    </section>`;
}

// ---------- Notes / 5k ----------
function bindLog(container, dateIso) {
  const noteEl = container.querySelector('#note');
  const fiveEl = container.querySelector('#fivek');
  noteEl?.addEventListener('change', () => setDayField(dateIso, 'notes', noteEl.value.trim()));
  fiveEl?.addEventListener('change', () => {
    const m = getDay(dateIso).metrics || {}; m.fiveK = fiveEl.value.trim();
    setDayField(dateIso, 'metrics', m);
  });
}

// ---------- Per-task ticks ----------
function bindTasks(container, ctx, iso, refs) {
  const refresh = () => {
    const tc = taskCount(iso, refs);
    const pct = tc.total ? Math.round((tc.done / tc.total) * 100) : 0;
    const bar = container.querySelector('#hero-pbar');
    if (bar) bar.style.width = `${pct}%`;
    const count = container.querySelector('#hero-pcount');
    if (count) count.textContent = `${tc.done}/${tc.total}`;
    setDayDone(iso, tc.all);
    const banner = container.querySelector('#done-banner');
    if (banner) banner.hidden = !tc.all;
    const markAll = container.querySelector('#mark-all');
    if (markAll) markAll.textContent = tc.all ? 'Reset' : 'Mark all';
    paintNudges(container.querySelector('#nudges'), ctx, iso);
  };

  container.querySelectorAll('[data-check]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ref = btn.dataset.check;
      const nowDone = !getTasks(iso)[ref];
      setTask(iso, ref, nowDone);
      const card = btn.closest('.sess');
      card.classList.toggle('is-done', nowDone);
      btn.classList.toggle('is-done', nowDone);
      btn.textContent = nowDone ? '✓' : '';
      if (nowDone) card.open = false;
      refresh();
    });
  });

  container.querySelector('#mark-all')?.addEventListener('click', () => {
    const tc = taskCount(iso, refs);
    const target = !tc.all;
    refs.forEach((r) => setTask(iso, r, target));
    ctx.refresh();
  });
}

// ---------- Protein tracker ----------
function proteinPlaceholder(variant) {
  return `<section class="card card--protein ${variant === 'strip' ? 'card--protein-strip' : ''}"><div id="protein-mount"></div></section>`;
}

function proteinBodyHTML(plan, iso) {
  const log = getProteinLog(iso);
  return `
    <div class="protein__body">
      <div class="pchips">
        ${(plan.proteinFoods || []).map((f) => `<button class="pchip" data-add="${f.g}" data-label="${esc(f.label)}" type="button">${esc(f.label)} <b>+${f.g}</b></button>`).join('')}
        <button class="pchip pchip--alt" data-custom="1" type="button">+ Other</button>
      </div>
      <div class="pcustom" hidden>
        <input class="field" id="pc-g" inputmode="numeric" placeholder="grams of protein" />
        <button class="btn btn--sm btn--primary" id="pc-add" type="button">Add</button>
      </div>
      ${log.length ? `<ul class="plog">${log.map((e, i) => `<li><span>${esc(e.label)}</span><span class="plog__g">${e.g}g <button class="plog__x" data-rm="${i}" type="button" aria-label="Remove ${esc(e.label)}">×</button></span></li>`).join('')}</ul>` : '<p class="protein__empty">Nothing logged yet — tap a food above.</p>'}
    </div>`;
}

function mountProtein(el, ctx, iso, variant) {
  if (!el) return;
  const { plan } = ctx;
  const target = plan.proteinTargetG || 140;
  const total = proteinTotal(iso);
  const pct = Math.round(Math.min(total / target, 1) * 100);
  const hit = total >= target;
  const remaining = Math.max(target - total, 0);
  const wasOpen = el.querySelector('details')?.hasAttribute('open') ?? false;

  let summary;
  if (variant === 'strip') {
    summary = `
      <summary class="pstrip__head">
        <div class="pstrip__main">
          <div class="pstrip__row">
            <span class="pstrip__title">Protein <b>${total}/${target}g</b></span>
            <span class="pstrip__hint ${hit ? 'is-hit' : ''}">${hit ? '✅ hit' : remaining + 'g to go'}</span>
          </div>
          <div class="bar bar--onclaret"><span class="${hit ? 'is-hit' : ''}" style="width:${pct}%"></span></div>
        </div>
        <span class="sess__chev">›</span>
      </summary>`;
  } else {
    const C = 2 * Math.PI * 42;
    const offset = C * (1 - Math.min(total / target, 1));
    summary = `
      <summary class="protein__top">
        <div class="ring">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle class="ring__bg" cx="50" cy="50" r="42"/>
            <circle class="ring__fg ${hit ? 'is-hit' : ''}" cx="50" cy="50" r="42" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/>
          </svg>
          <div class="ring__label"><span class="ring__num">${total}</span><span class="ring__den">/ ${target}g</span></div>
        </div>
        <div class="protein__meta">
          <p class="protein__title">Protein today</p>
          <p class="protein__msg ${hit ? 'is-hit' : ''}">${hit ? '✅ Target smashed!' : `<b>${remaining}g</b> to go`}</p>
          <p class="protein__hint">Tap to log food ⌄</p>
        </div>
      </summary>`;
  }

  el.innerHTML = `<details class="protein-more" ${wasOpen ? 'open' : ''}>${summary}${proteinBodyHTML(plan, iso)}</details>`;

  const repaint = () => { mountProtein(el, ctx, iso, variant); paintNudges(document.getElementById('nudges'), ctx, iso); };
  el.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => { addProtein(iso, b.dataset.label, Number(b.dataset.add)); repaint(); }));
  el.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { removeProtein(iso, Number(b.dataset.rm)); repaint(); }));
  const customBtn = el.querySelector('[data-custom]');
  const customBox = el.querySelector('.pcustom');
  customBtn?.addEventListener('click', () => { customBox.hidden = !customBox.hidden; if (!customBox.hidden) el.querySelector('#pc-g').focus(); });
  const addCustom = () => { const v = Number(el.querySelector('#pc-g').value); if (v > 0) { addProtein(iso, 'Other', v); repaint(); } };
  el.querySelector('#pc-add')?.addEventListener('click', addCustom);
  el.querySelector('#pc-g')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustom(); });
}
