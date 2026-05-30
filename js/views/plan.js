// The full 4-week schedule, and a tap-through detail for any day.
import { allDays, resolveRef, typeInfo, rpeColour } from '../plan.js';
import { getProgress, getDay, setDayDone, stats } from '../storage.js';
import { todayISO, prettyDate, parseISO, DOW, MONTHS } from '../util.js';
import { componentHTML } from './components.js';
import { esc } from '../util.js';

export function renderPlan(container, ctx) {
  const { plan } = ctx;
  const prog = getProgress();
  const today = todayISO();
  const st = stats(plan);

  let html = `
    <section class="card card--accent">
      <div class="row-between">
        <div><strong>Road to pre-season</strong><div class="ex-sub">Players return ${esc(prettyDate(plan.preSeasonReturn))}</div></div>
        <div class="wpct">${st.percent}%</div>
      </div>
      <div class="bar" style="margin-top:10px"><span style="width:${st.percent}%"></span></div>
    </section>`;

  for (const wk of plan.weeks) {
    const wkStats = st.byWeek[wk.week];
    html += `<div class="week-block">
      <div class="week-head">
        <h3>${esc(wk.title || ('Week ' + wk.week))}</h3>
        ${wkStats ? `<span class="wpct">${wkStats.done}/${wkStats.total}</span>` : ''}
      </div>`;

    if (!wk.days.length) {
      html += `<div class="note">${esc(wk.note || 'Rest week.')}</div>`;
    }

    for (const day of wk.days) {
      const d = parseISO(day.date);
      const info = typeInfo(plan, day.type);
      const done = prog[day.date]?.done;
      const sub = summarise(plan, day);
      const isToday = day.date === today ? '1' : '0';
      const tappable = day.components && day.components.length > 0;
      html += `
        <button class="day-row" data-today="${isToday}" data-date="${esc(day.date)}" ${tappable ? '' : 'disabled style="opacity:.7;cursor:default"'}>
          <div class="day-row__date">
            <div class="day-row__dow">${DOW[d.getDay()]}</div>
            <div class="day-row__num">${d.getDate()}</div>
          </div>
          <div class="day-row__main">
            <div class="day-row__type"><span class="badge-dot" style="background:${info.colour}"></span> ${esc(info.label)}${day.rpe ? ` · <span class="muted">RPE ${esc(day.rpe)}</span>` : ''}</div>
            <div class="day-row__sub">${esc(sub)}</div>
          </div>
          <div class="day-row__tick" data-done="${done ? '1' : '0'}">${done ? '✓' : ''}</div>
        </button>`;
    }
    html += `</div>`;
  }

  container.innerHTML = html;
  container.querySelectorAll('.day-row[data-date]:not([disabled])').forEach((el) => {
    el.addEventListener('click', () => { location.hash = '#/day/' + el.dataset.date; });
  });
}

function summarise(plan, day) {
  if (!day.components || !day.components.length) {
    return day.type === 'preseason' ? 'Players return' : (day.type === 'off' ? 'Rest' : 'Recovery');
  }
  return day.components.map((r) => {
    const n = resolveRef(plan, r);
    return n ? n.title.replace(/^(Gym \d+ — |Pitch\/Run \w+ — )/, '') : r;
  }).join(' · ');
}

// ---- Day detail ----
export function renderDay(container, ctx, dateIso) {
  const { plan } = ctx;
  const day = allDays(plan).find((d) => d.date === dateIso);
  if (!day) { container.innerHTML = `<div class="note">Day not found.</div>`; return; }

  const info = typeInfo(plan, day.type);
  const d = parseISO(day.date);
  const rec = getDay(day.date);

  const comps = day.components.map((ref, i) => {
    const node = resolveRef(plan, ref);
    return node ? componentHTML(node, i + 1, { week: String(day.week) }) : '';
  }).join('');

  container.innerHTML = `
    <button class="btn btn--ghost btn--sm" id="back" style="margin-bottom:12px">‹ Back to plan</button>
    <section class="card card--accent">
      <p class="date muted">${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · Week ${day.week}</p>
      <h2 style="margin:.2em 0">${esc(day.title || info.label)}</h2>
      <div class="chips">
        <span class="chip" style="background:${info.colour};color:#fff">${esc(info.label)}</span>
        ${day.rpe ? `<span class="chip chip--rpe" style="background:${rpeColour(plan, day.rpe)}">RPE ${esc(day.rpe)}</span>` : ''}
      </div>
    </section>
    ${comps || `<div class="note">${esc(info.blurb || 'Rest day.')}</div>`}
    ${rec.notes ? `<section class="card"><strong>Your notes</strong><p class="detail-text">${esc(rec.notes)}</p></section>` : ''}
    <button class="btn ${rec.done ? 'btn--ghost' : 'btn--done'}" id="toggle">${rec.done ? 'Mark as not done' : '✓ Mark as done'}</button>
  `;

  container.querySelector('#back').addEventListener('click', () => { location.hash = '#/plan'; });
  container.querySelector('#toggle').addEventListener('click', () => {
    setDayDone(day.date, !getDay(day.date).done);
    renderDay(container, ctx, dateIso);
  });
}
