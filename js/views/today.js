// The home screen: a guided, tickable session checklist (protein now lives in
// the global sticky bar in the app shell). Plus logging.
import { resolveToday, resolveRef, typeInfo, rpeColour } from '../plan.js';
import { getDay, setDayDone, setDayField, getTasks, setTask, taskCount } from '../storage.js';
import { todayISO, prettyDate, parseISO, daysBetween, DOW_LONG, MONTHS } from '../util.js';
import { componentCard, componentHTML } from './components.js';
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
    const firstOpen = exact.components.find((r) => !tasks[r]); // guided: open the current step

    const comps = exact.components.map((ref, i) => {
      const node = resolveRef(plan, ref);
      return node ? componentCard(node, i + 1, { week: String(exact.week), ref, done: !!tasks[ref], open: ref === firstOpen }) : '';
    }).join('');

    const nut = resolveRef(plan, 'nutrition');

    container.innerHTML = `
      ${heroHTML(kicker, exact.title || info.label, info.blurb, exact, plan, { done: tc.done, total: tc.total })}
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
    ${heroHTML(kicker, title, blurb, null, plan, null)}
    <section class="card center">
      <div class="big-emoji">${emoji}</div>
      <p class="muted">Recovery matters most on rest days — sleep well, eat well, and still hit your <b>${plan.proteinTargetG || 140}g protein</b> (log it in the pill above).</p>
    </section>
    <button class="btn btn--primary btn--big" id="go-plan">See the full plan</button>
  `;
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
        // guided: open the next still-to-do step
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
