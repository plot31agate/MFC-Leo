// Renders a single library node (warm-up, exercise list, run, gym, nutrition, subs)
// to HTML. Shared by the Today view and the Plan day-detail view.
import { esc } from '../util.js';
import { pitchDiagram } from './diagrams.js';

function videoLinks(videos) {
  if (!videos || !videos.length) return '';
  return videos.map((v, i) =>
    `<a class="video-link" href="${esc(v)}" target="_blank" rel="noopener">▶ ${videos.length > 1 ? 'Demo ' + (i + 1) : 'Watch'}</a>`
  ).join(' ');
}

function renderBody(node, ctx = {}) {
  switch (node.kind) {
    case 'routine':
      return `
        ${node.subtitle ? `<p class="ex-sub">${esc(node.subtitle)}</p>` : ''}
        <ul class="ex-list">
          ${node.steps.map((s) => `
            <li><div><div class="ex-name">${esc(s.name)}</div><div class="ex-sub">${esc(s.detail)}</div></div></li>
          `).join('')}
        </ul>`;

    case 'exerciseList':
      return `
        ${node.subtitle ? `<p class="ex-sub">${esc(node.subtitle)}</p>` : ''}
        <ul class="ex-list">
          ${node.exercises.map((e) => `
            <li>
              <div>
                <div class="ex-name">${esc(e.name)}</div>
                ${e.cue ? `<div class="ex-sub">${esc(e.cue)}</div>` : ''}
                ${videoLinks(e.videos)}
              </div>
              <div class="ex-meta">${esc(e.setsReps)}</div>
            </li>`).join('')}
        </ul>`;

    case 'run': {
      const wk = ctx.week;
      const wkLine = (node.byWeek && wk && node.byWeek[wk])
        ? `<p class="ex-name" style="color:var(--claret)">This week: ${esc(node.byWeek[wk])}</p>` : '';
      const diagram = node.diagram ? pitchDiagram(node.diagram) : '';
      return `${wkLine}<p class="detail-text">${esc(node.detail || node.summary || '')}</p>${diagram}`;
    }

    case 'gym':
      return `
        <ul class="ex-list">
          ${node.exercises.map((e) => `
            <li>
              <div>
                <div class="ex-name">${esc(e.name)}</div>
                ${e.cue ? `<div class="ex-sub">${esc(e.cue)}</div>` : ''}
              </div>
              <div class="ex-meta">${esc(e.load)}${e.rest ? `<br><span class="ex-sub">rest ${esc(e.rest)}</span>` : ''}</div>
            </li>`).join('')}
        </ul>
        ${node.footer ? `<p class="footnote">${esc(node.footer)}</p>` : ''}`;

    case 'nutrition': {
      const col = (w) => {
        const x = node[w];
        if (!x) return '';
        const ex = Array.isArray(x.examples)
          ? `<ul class="food-list">${x.examples.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
          : `<div class="ex-sub">${esc(x.examples)}</div>`;
        return `<div class="nut__col"><div class="nut__when">${esc(w)}</div><div class="nut__goal">${esc(x.goal)}</div>${ex}</div>`;
      };
      const tips = (node.tips && node.tips.length)
        ? `<p class="section-title" style="margin-top:14px">Everyday eating</p>
           <ul class="ex-list">${node.tips.map((t) => `<li><div class="ex-sub">${esc(t)}</div></li>`).join('')}</ul>`
        : '';
      return `<div class="nut">${['before', 'during', 'after'].map(col).join('')}</div>${tips}${node.note ? `<p class="footnote">${esc(node.note)}</p>` : ''}`;
    }

    case 'substitutes':
      return `
        ${node.subtitle ? `<p class="ex-sub">${esc(node.subtitle)}</p>` : ''}
        <ul class="ex-list">
          ${node.items.map((i) => `
            <li><div class="ex-name">${esc(i.exercise)}</div><div class="ex-meta">→ ${esc(i.alt)}</div></li>
          `).join('')}
        </ul>`;

    default:
      return `<p class="detail-text">${esc(node.detail || '')}</p>`;
  }
}

const KIND_LABELS = { run: 'Run / Pitch', gym: 'Gym', routine: 'Warm-up', exerciseList: '', nutrition: 'Fuel', substitutes: '' };

// Always-open card (used on Today so nothing is hidden behind a tap).
export function componentCard(node, order, ctx = {}) {
  const kindLabel = KIND_LABELS[node.kind] || '';
  return `
    <section class="sess">
      <div class="sess__head">
        ${order ? `<span class="sess__num">${order}</span>` : ''}
        <div class="sess__titles">
          <h3 class="sess__title">${esc(node.title)}</h3>
          ${node.summary && node.kind === 'run' ? `<p class="sess__sub">${esc(node.summary)}</p>` : ''}
        </div>
        ${kindLabel ? `<span class="sess__tag">${kindLabel}</span>` : ''}
      </div>
      <div class="sess__body">${renderBody(node, ctx)}</div>
    </section>`;
}

// Collapsible component block with an order number.
export function componentHTML(node, order, ctx = {}) {
  const kindLabel = { run: 'Run / Pitch', gym: 'Gym', routine: 'Warm-up', exerciseList: '', nutrition: 'Fuel', substitutes: '' }[node.kind] || '';
  const openAttr = ctx.open ? ' open' : '';
  return `
    <details class="comp"${openAttr}>
      <summary class="comp__head">
        ${order ? `<span class="comp__order">${order}</span>` : ''}
        <span class="comp__title">${esc(node.title)}${node.summary && node.kind === 'run' ? `<div class="ex-sub">${esc(node.summary)}</div>` : ''}</span>
        ${kindLabel ? `<span class="comp__kind">${kindLabel}</span>` : ''}
        <span class="comp__chev">›</span>
      </summary>
      <div class="comp__body">${renderBody(node, ctx)}</div>
    </details>`;
}
