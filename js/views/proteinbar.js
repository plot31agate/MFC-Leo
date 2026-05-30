// Global sticky protein bar — lives in the app shell and is visible on every
// screen, so logging protein towards the daily target is always one tap away.
import { getProteinLog, proteinTotal, addProtein, removeProtein } from '../storage.js';
import { todayISO, esc } from '../util.js';
import { paintNudges } from './nudges.js';

let _plan = null;

export function mountProteinBar(plan) { _plan = plan; render(); }
export function updateProteinBar() { render(); }

function bodyHTML(iso) {
  const log = getProteinLog(iso);
  return `
    <div class="pchips">
      ${(_plan.proteinFoods || []).map((f) => `<button class="pchip" data-add="${f.g}" data-label="${esc(f.label)}" type="button">${esc(f.label)} <b>+${f.g}</b></button>`).join('')}
      <button class="pchip pchip--alt" data-custom="1" type="button">+ Other</button>
    </div>
    <div class="pcustom" hidden>
      <input class="field" id="pbar-g" inputmode="numeric" placeholder="grams of protein" />
      <button class="btn btn--sm btn--primary" id="pbar-add" type="button">Add</button>
    </div>
    ${log.length ? `<ul class="plog">${log.map((e, i) => `<li><span>${esc(e.label)}</span><span class="plog__g">${e.g}g <button class="plog__x" data-rm="${i}" type="button" aria-label="Remove ${esc(e.label)}">×</button></span></li>`).join('')}</ul>` : '<p class="protein__empty">Nothing logged yet — tap a food above.</p>'}`;
}

function render() {
  const el = document.getElementById('protein-bar');
  if (!el || !_plan) return;
  const iso = todayISO();
  const target = _plan.proteinTargetG || 140;
  const total = proteinTotal(iso);
  const pct = Math.round(Math.min(total / target, 1) * 100);
  const hit = total >= target;

  const existing = el.querySelector('.pbar__panel');
  const open = existing ? !existing.hasAttribute('hidden') : false;

  el.className = 'pbar' + (hit ? ' is-hit' : '');
  el.innerHTML = `
    <button class="pbar__summary" id="pbar-toggle" type="button" aria-expanded="${open}">
      <span class="pbar__icon">🥤</span>
      <span class="pbar__label">Protein <b>${total}/${target}g</b></span>
      <span class="pbar__track"><span class="pbar__fill ${hit ? 'is-hit' : ''}" style="width:${pct}%"></span></span>
      <span class="pbar__add">${hit ? '✓' : '＋'}</span>
    </button>
    <div class="pbar__panel" ${open ? '' : 'hidden'}>${bodyHTML(iso)}</div>`;

  const refresh = () => {
    render();
    const n = document.getElementById('nudges');
    if (n) paintNudges(n, { plan: _plan }, iso);
  };

  el.querySelector('#pbar-toggle').addEventListener('click', () => {
    const p = el.querySelector('.pbar__panel');
    p.hidden = !p.hidden;
    el.querySelector('#pbar-toggle').setAttribute('aria-expanded', String(!p.hidden));
  });
  el.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => { addProtein(iso, b.dataset.label, Number(b.dataset.add)); refresh(); }));
  el.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { removeProtein(iso, Number(b.dataset.rm)); refresh(); }));
  const customBtn = el.querySelector('[data-custom]');
  const customBox = el.querySelector('.pcustom');
  customBtn?.addEventListener('click', () => { customBox.hidden = !customBox.hidden; if (!customBox.hidden) el.querySelector('#pbar-g').focus(); });
  const addCustom = () => { const v = Number(el.querySelector('#pbar-g').value); if (v > 0) { addProtein(iso, 'Other', v); refresh(); } };
  el.querySelector('#pbar-add')?.addEventListener('click', addCustom);
  el.querySelector('#pbar-g')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustom(); });
}
