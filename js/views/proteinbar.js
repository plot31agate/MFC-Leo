// Global sticky protein "fuel gauge" pill — pinned under the header on every
// screen so logging towards the daily target is always one tap away. The pill
// fills as you log, shows a streak flame, and celebrates when the target's hit.
import { getProteinLog, proteinTotal, addProtein, removeProtein, proteinStreak } from '../storage.js';
import { todayISO, esc } from '../util.js';

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
  const streak = proteinStreak(target);

  const existing = el.querySelector('.ppill-wrap');
  const open = existing ? existing.hasAttribute('open') : false;

  el.innerHTML = `
    <details class="ppill-wrap" ${open ? 'open' : ''}>
      <summary class="ppill ${hit ? 'is-hit' : ''}">
        <span class="ppill__fill" style="width:${pct}%"></span>
        <span class="ppill__row">
          <span class="ppill__icon">🥤</span>
          <span class="ppill__label">Protein <b>${total}/${target}g</b></span>
          ${streak > 1 ? `<span class="ppill__streak">🔥 ${streak}</span>` : ''}
          <span class="ppill__cta">${hit ? 'Hit! 🔥' : '＋ Log'}</span>
        </span>
      </summary>
      <div class="ppill__panel">${bodyHTML(iso)}</div>
    </details>`;

  const refresh = () => render();
  el.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => { addProtein(iso, b.dataset.label, Number(b.dataset.add)); refresh(); }));
  el.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { removeProtein(iso, Number(b.dataset.rm)); refresh(); }));
  const customBtn = el.querySelector('[data-custom]');
  const customBox = el.querySelector('.pcustom');
  customBtn?.addEventListener('click', () => { customBox.hidden = !customBox.hidden; if (!customBox.hidden) el.querySelector('#pbar-g').focus(); });
  const addCustom = () => { const v = Number(el.querySelector('#pbar-g').value); if (v > 0) { addProtein(iso, 'Other', v); refresh(); } };
  el.querySelector('#pbar-add')?.addEventListener('click', addCustom);
  el.querySelector('#pbar-g')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustom(); });
}
