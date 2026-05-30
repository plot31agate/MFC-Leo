// The "Guide" tab: always-available reference material from the club programme.
import { resolveRef } from '../plan.js';
import { componentHTML } from './components.js';
import { esc } from '../util.js';

export function renderReference(container, ctx) {
  const { plan } = ctx;

  const blocks = [
    resolveRef(plan, 'warmup'),
    resolveRef(plan, 'preactivation'),
    resolveRef(plan, 'mobility'),
    resolveRef(plan, 'nutrition'),
    resolveRef(plan, 'substitutes'),
  ].filter(Boolean).map((n) => componentHTML(n, null, {})).join('');

  const gyms = Object.values(plan.library.gym || {}).map((n) => componentHTML(n, null, {})).join('');
  const runs = Object.values(plan.library.runs || {}).map((n) => componentHTML(n, null, {})).join('');

  const rpe = (plan.rpeScale || []).map((r) => `
    <div class="rpe-row" style="background:${r.colour}">
      <div class="num">${esc(r.range)}</div>
      <div class="txt"><b>${esc(r.label)}</b><small>${esc(r.note)}</small></div>
    </div>`).join('');

  const pdfList = plan.officialPdfs || [];
  const pdfs = pdfList.map((p) =>
    `<a href="${esc(p.file)}" target="_blank" rel="noopener">${esc(p.label)} ↗</a>`).join('');

  container.innerHTML = `
    <p class="section-title">Before every session</p>
    ${blocks}

    <p class="section-title">Gym sessions</p>
    ${gyms}

    <p class="section-title">Pitch &amp; run sessions</p>
    ${runs}

    <p class="section-title">RPE effort scale</p>
    <section class="card">${rpe}</section>

    ${pdfs ? `<p class="section-title">Official club documents</p>
    <section class="card link-list">${pdfs}</section>` : ''}

    <p class="footnote">Programme provided by Motherwell FC.</p>
  `;
}
