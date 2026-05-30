// The full 4-week schedule, and a tap-through detail for any day.
import { allDays, resolveRef, typeInfo, rpeColour } from '../plan.js';
import { getProgress, getDay, setDayDone, stats } from '../storage.js';
import { todayISO, prettyDate, parseISO, daysBetween, DOW, MONTHS } from '../util.js';
import { componentHTML } from './components.js';
import { esc } from '../util.js';

export function renderPlan(container, ctx) {
  const { plan } = ctx;
  const prog = getProgress();
  const today = todayISO();
  const st = stats(plan);

  const daysToGo = daysBetween(today, plan.preSeasonReturn);
  let html = `
    <section class="hero">
      <p class="hero__kicker">Road to pre-season</p>
      <h1 class="hero__title">${daysToGo > 0 ? `${daysToGo} day${daysToGo === 1 ? '' : 's'} to go` : 'Pre-season!'}</h1>
      <p class="hero__blurb">Players return ${esc(prettyDate(plan.preSeasonReturn))}</p>
      <div class="hero__progress">
        <div class="hero__pbar"><span style="width:${st.percent}%"></span></div>
        <span class="hero__pcount">${st.percent}%</span>
      </div>
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
        <button class="day-row ${tappable ? '' : 'day-row--rest'}" data-today="${isToday}" data-date="${esc(day.date)}" ${tappable ? '' : 'disabled'} style="border-left-color:${info.colour}">
          <div class="day-row__date">
            <div class="day-row__dow">${DOW[d.getDay()]}</div>
            <div class="day-row__num">${d.getDate()}</div>
          </div>
          <div class="day-row__main">
            <div class="day-row__type">${esc(info.label)}${day.rpe ? ` · <span class="muted">RPE ${esc(day.rpe)}</span>` : ''}${isToday === '1' ? ' <span class="today-pill">TODAY</span>' : ''}</div>
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
    <button class="link-btn" id="back" style="margin-bottom:10px">‹ Back to plan</button>
    <section class="hero">
      <p class="hero__kicker">${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · Week ${day.week}</p>
      <h1 class="hero__title">${esc(day.title || info.label)}</h1>
      <div class="hero__chips">
        <span class="chip chip--type">${esc(info.label)}</span>
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
