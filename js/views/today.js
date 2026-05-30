// The home screen: a guided, tickable session checklist with a protein "fuel"
// strip built into the session hero that pops open a quick-add panel.
import { resolveToday, resolveRef, typeInfo, rpeColour } from '../plan.js';
import {
  getDay, setDayDone, setDayField, getTasks, setTask, taskCount,
  getProteinLog, proteinTotal, addProtein, removeProtein, proteinStreak,
} from '../storage.js';
import { todayISO, prettyDate, parseISO, daysBetween, DOW_LONG, MONTHS } from '../util.js';
import { componentCard, componentHTML } from './components.js';
import { esc } from '../util.js';

export function renderToday(container, ctx) {
  const { plan } = ctx;
  const iso = todayISO();
  const { state, day } = resolveToday(plan, iso);
  const d = parseISO(iso);
  const kicker = `TODAY · ${DOW_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const fuel = fuelData(plan, iso);

  const exact = state === 'training' ? day : null;
  const isTraining = !!(exact && exact.components && exact.components.length && exact.type !== 'preseason');

  if (isTraining) {
    const info = typeInfo(plan, exact.type);
    const rec = getDay(exact.date);
    const tasks = getTasks(exact.date);
    const tc = taskCount(exact.date, exact.components);
    const benchmark = exact.components.includes('runs.benchmark5k');
    const firstOpen = exact.components.find((r) => !tasks[r]);

    const comps = exact.components.map((ref, i) => {
      const node = resolveRef(plan, ref);
      return node ? componentCard(node, i + 1, { week: String(exact.week), ref, done: !!tasks[ref], open: ref === firstOpen }) : '';
    }).join('');

    const nut = resolveRef(plan, 'nutrition');

    container.innerHTML = `
      ${heroHTML(kicker, exact.title || info.label, info.blurb, exact, plan, { done: tc.done, total: tc.total }, fuel)}
      ${fuelPopHTML(plan, iso)}
      <div class="done-banner" id="done-banner" ${tc.all ? '' : 'hidden'}>✓ Completed — great work, Leo!</div>

      <div class="row-between" style="margin:20px 2px 10px">
        <h2 class="block-title" style="margin:0">Your session <span class="block-title__hint">— tick as you go</span></h2>
        <div class="sess-actions">
          <button class="link-btn" id="expand-all">Expand all</button>
          <button class="link-btn" id="mark-all">${tc.all ? 'Reset' : 'Mark all'}</button>
        </div>
      </div>
      ${comps}

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

    mountFuel(container, ctx, iso);
    bindLog(container, exact.date);
    bindTasks(container, ctx, iso, exact.components);
    return;
  }

  // ---- Non-training days ----
  let title, blurb, emoji = '🛌';
  if (state === 'before') { title = 'Counting down'; blurb = `Programme starts ${prettyDate(day.date)} — ${daysBetween(iso, day.date)} day(s) to go. Rest up and recover. 🌴`; emoji = '🌴'; }
  else if (state === 'after') { title = 'Pre-Season!'; blurb = "Players have returned. You put the work in — go and show them, Leo. 💪"; emoji = '⚽'; }
  else if (exact && exact.type === 'preseason') { title = 'Pre-Season!'; blurb = 'Players return for pre-season training today. 💪'; emoji = '⚽'; }
  else if (state === 'between') { title = 'Rest day'; blurb = day ? `Nothing scheduled — recover well. Next up: ${typeInfo(plan, day.type).label} on ${prettyDate(day.date)}.` : 'Recover well.'; }
  else { title = exact && exact.type === 'off' ? 'Day Off' : 'Recovery'; blurb = (exact ? typeInfo(plan, exact.type).blurb : '') || 'Rest day — take it. Recovery is part of the plan.'; }

  container.innerHTML = `
    ${heroHTML(kicker, title, blurb, null, plan, null, fuel)}
    ${fuelPopHTML(plan, iso)}
    <section class="card center">
      <div class="big-emoji">${emoji}</div>
      <p class="muted">Recovery matters most on rest days — sleep well, eat well, and still hit your <b>${plan.proteinTargetG || 140}g protein</b>.</p>
    </section>
    <button class="btn btn--primary btn--big" id="go-plan">See the full plan</button>
  `;
  mountFuel(container, ctx, iso);
  container.querySelector('#go-plan').addEventListener('click', () => { location.hash = '#/plan'; });
}

// ---------- Hero (with protein fuel strip) ----------
function heroHTML(kicker, title, blurb, day, plan, progress, fuel) {
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
          <span class="hero__pcount" id="hero-pcount"><span class="js-count" data-to="${progress.done}">${progress.done}</span>/${progress.total}</span>
        </div>` : ''}
      ${fuelBarHTML(fuel)}
    </section>`;
}

// ---------- Protein fuel strip + pop-out panel ----------
function fuelData(plan, iso) {
  const target = plan.proteinTargetG || 140;
  const total = proteinTotal(iso);
  return { total, target, pct: Math.round(Math.min(total / target, 1) * 100), hit: total >= target, streak: proteinStreak(target) };
}

function fuelBarHTML(f) {
  return `
    <button class="fuel ${f.hit ? 'is-hit' : ''}" id="fuel-toggle" type="button" aria-expanded="false">
      <span class="fuel__fill" style="width:${f.pct}%"></span>
      <span class="fuel__row">
        <span class="fuel__label">PROTEIN <b><span class="js-count" data-to="${f.total}">${f.total}</span>/${f.target}g</b></span>
        <span class="fuel__streak" ${f.streak > 1 ? '' : 'hidden'}>🔥 ${f.streak}</span>
        <span class="fuel__cta">${f.hit ? 'HIT! 🔥' : 'LOG ▾'}</span>
      </span>
    </button>`;
}

function fuelPopHTML(plan, iso) {
  return `<div class="fuel-pop" id="fuel-pop" hidden>${fuelBodyHTML(plan, iso)}</div>`;
}

function fuelBodyHTML(plan, iso) {
  const log = getProteinLog(iso);
  return `
    <div class="fuel-pop__inner">
      <div class="pchips">
        ${(plan.proteinFoods || []).map((f) => `<button class="pchip" data-add="${f.g}" data-label="${esc(f.label)}" type="button">${esc(f.label)} <b>+${f.g}</b></button>`).join('')}
        <button class="pchip pchip--alt" data-custom="1" type="button">+ Other</button>
      </div>
      <div class="pcustom" hidden>
        <input class="field" id="fuel-g" inputmode="numeric" placeholder="grams of protein" />
        <button class="btn btn--sm btn--primary" id="fuel-add" type="button">Add</button>
      </div>
      ${log.length ? `<ul class="plog">${log.map((e, i) => `<li><span>${esc(e.label)}</span><span class="plog__g">${e.g}g <button class="plog__x" data-rm="${i}" type="button" aria-label="Remove ${esc(e.label)}">×</button></span></li>`).join('')}</ul>` : '<p class="protein__empty">Nothing logged yet — tap a food above.</p>'}
    </div>`;
}

function mountFuel(container, ctx, iso) {
  const { plan } = ctx;
  const toggle = container.querySelector('#fuel-toggle');
  const pop = container.querySelector('#fuel-pop');
  if (!toggle || !pop) return;
  const target = plan.proteinTargetG || 140;

  const updateBar = () => {
    const f = fuelData(plan, iso);
    toggle.querySelector('.fuel__fill').style.width = `${f.pct}%`;
    toggle.classList.toggle('is-hit', f.hit);
    toggle.querySelector('.fuel__label').innerHTML = `PROTEIN <b>${f.total}/${f.target}g</b>`;
    toggle.querySelector('.fuel__cta').textContent = f.hit ? 'HIT! 🔥' : 'LOG ▾';
    const st = toggle.querySelector('.fuel__streak');
    st.textContent = `🔥 ${f.streak}`;
    st.hidden = f.streak <= 1;
  };

  const renderPop = () => { pop.innerHTML = fuelBodyHTML(plan, iso); bindPop(); };

  const bindPop = () => {
    pop.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => { addProtein(iso, b.dataset.label, Number(b.dataset.add)); updateBar(); renderPop(); }));
    pop.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { removeProtein(iso, Number(b.dataset.rm)); updateBar(); renderPop(); }));
    const cb = pop.querySelector('[data-custom]');
    const box = pop.querySelector('.pcustom');
    cb?.addEventListener('click', () => { box.hidden = !box.hidden; if (!box.hidden) pop.querySelector('#fuel-g').focus(); });
    const addC = () => { const v = Number(pop.querySelector('#fuel-g').value); if (v > 0) { addProtein(iso, 'Other', v); updateBar(); renderPop(); } };
    pop.querySelector('#fuel-add')?.addEventListener('click', addC);
    pop.querySelector('#fuel-g')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') addC(); });
  };

  toggle.addEventListener('click', () => {
    pop.hidden = !pop.hidden;
    toggle.setAttribute('aria-expanded', String(!pop.hidden));
  });
  bindPop();
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

// ---------- Per-task ticks (guided auto-advance) ----------
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
    if (banner) {
      banner.hidden = !tc.all;
      banner.classList.toggle('celebrate', tc.all);
    }
    const markAll = container.querySelector('#mark-all');
    if (markAll) markAll.textContent = tc.all ? 'Reset' : 'Mark all';
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
      if (nowDone) {
        card.removeAttribute('open');
        const tasksNow = getTasks(iso);
        const next = [...container.querySelectorAll('.sess[data-ref]')].find((s) => !tasksNow[s.dataset.ref]);
        if (next) next.setAttribute('open', '');
      } else {
        card.setAttribute('open', '');
      }
      refresh();
    });
  });

  const expandBtn = container.querySelector('#expand-all');
  expandBtn?.addEventListener('click', () => {
    const ds = [...container.querySelectorAll('.sess')];
    const anyClosed = ds.some((s) => !s.hasAttribute('open'));
    ds.forEach((s) => { if (anyClosed) s.setAttribute('open', ''); else s.removeAttribute('open'); });
    expandBtn.textContent = anyClosed ? 'Collapse all' : 'Expand all';
  });

  container.querySelector('#mark-all')?.addEventListener('click', () => {
    const tc = taskCount(iso, refs);
    const target = !tc.all;
    refs.forEach((r) => setTask(iso, r, target));
    ctx.refresh();
  });
}
