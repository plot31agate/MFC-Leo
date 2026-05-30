// Bootstraps the app, loads the plan, and routes between views via the URL hash.
import { loadPlan } from './plan.js';
import { renderToday } from './views/today.js';
import { renderPlan, renderDay } from './views/plan.js';
import { renderProgress } from './views/progress.js';
import { renderReference } from './views/reference.js';
import { todayISO, daysBetween, runCounters } from './util.js';
import { hasProfile, saveProfile, playerName, proteinTarget } from './storage.js';

const app = document.getElementById('app');
const titleEl = document.getElementById('header-title');
const metaEl = document.getElementById('header-meta');
const bootAt = performance.now();

function setHeaderMeta(plan) {
  if (!metaEl || !plan) return;
  const days = daysBetween(todayISO(), plan.preSeasonReturn);
  metaEl.innerHTML = days > 0
    ? `<b class="js-count" data-to="${days}">${days}</b> day${days === 1 ? '' : 's'} to pre-season`
    : (days === 0 ? '⚽ Pre-season today!' : '⚽ Pre-season');
}

let ctx = null;

function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '') || 'today';
  const [name, ...rest] = hash.split('/');
  return { name, arg: rest.join('/') };
}

function setActiveTab(name) {
  document.querySelectorAll('.tabbar__item').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.tab === name);
  });
}

function render() {
  const { name, arg } = currentRoute();
  setActiveTab(name === 'day' ? 'plan' : name);
  window.scrollTo(0, 0);

  try {
    switch (name) {
      case 'plan': renderPlan(app, ctx); break;
      case 'day': renderDay(app, ctx, arg); break;
      case 'progress': renderProgress(app, ctx); break;
      case 'reference': renderReference(app, ctx); break;
      default: renderToday(app, ctx);
    }
    runCounters(app);
  } catch (err) {
    app.innerHTML = `<div class="note">Something went wrong rendering this page.<br><small>${err.message}</small></div>`;
    console.error(err);
  }
}

// ---------- Splash ----------
function hideSplash() {
  const s = document.getElementById('splash');
  if (!s) { maybeIntro(); return; }
  const wait = Math.max(0, 900 - (performance.now() - bootAt));
  setTimeout(() => {
    s.classList.add('is-hidden');
    runCounters(document); // animate the reveal
    setTimeout(() => { s.remove(); maybeIntro(); }, 520);
  }, wait);
}

// ---------- First-run: profile setup, then guide ----------
const INTRO_KEY = 'mfc.intro.v1';

// New players set up their name + protein target before anything else.
function maybeIntro() {
  if (!hasProfile()) { showSetup(); return; }
  showGuide();
}

function showSetup() {
  const plan = ctx && ctx.plan;
  const defTarget = (plan && plan.proteinTargetG) || 140;
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <div class="intro__card">
      <img src="icons/crest.jpg" alt="" width="64" height="64" style="display:block;margin:0 auto 8px;border-radius:12px" />
      <h2>Welcome ⚽</h2>
      <p class="muted">Your Motherwell pre-season, one day at a time. Let's set you up.</p>
      <label class="lbl" for="setup-name">Your name</label>
      <input class="field" id="setup-name" type="text" placeholder="First name" autocomplete="given-name" maxlength="40" />
      <label class="lbl" for="setup-protein">Daily protein target (g)</label>
      <input class="field" id="setup-protein" type="number" inputmode="numeric" min="0" max="400" step="5" value="${defTarget}" />
      <p class="muted" style="font-size:13px;margin-top:6px">Not sure? Your coach can advise — ${defTarget}g is a solid default.</p>
      <button class="btn btn--primary" id="setup-go" style="margin-top:14px">Start ⚽</button>
    </div>`;
  document.body.appendChild(el);
  const nameInput = el.querySelector('#setup-name');
  const go = () => {
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); nameInput.style.borderColor = '#c0392b'; return; }
    saveProfile({ name, proteinTargetG: el.querySelector('#setup-protein').value });
    if (titleEl) titleEl.textContent = playerName(plan);
    el.classList.add('is-hidden');
    setTimeout(() => { el.remove(); showGuide(); }, 360);
  };
  el.querySelector('#setup-go').addEventListener('click', go);
  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
}

function showGuide() {
  try { if (localStorage.getItem(INTRO_KEY)) return; } catch { return; }
  const target = proteinTarget(ctx && ctx.plan);
  const sections = [
    ['Today', `Your session for the day — tick each part off as you go, and log protein in the amber bar to hit ${target}g.`],
    ['Plan', 'The whole 4-week programme, counting down to pre-season.'],
    ['Progress', 'Your stats — sessions done, day streak, 5km best and protein days.'],
    ['Guide', 'Warm-ups, drills, gym sessions and nutrition to look up any time.'],
    ['Reminders', 'Tap “Add” on the Today prompt to put session & protein alerts on your phone.'],
  ];
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <div class="intro__card">
      <h2>Here's the app 👋</h2>
      <p class="muted">Everything you need for pre-season:</p>
      <ul class="intro__list">
        ${sections.map(([t, d]) => `<li><span class="intro__bullet"></span><div><b>${t}</b><span>${d}</span></div></li>`).join('')}
      </ul>
      <button class="btn btn--primary" id="intro-go">Let's go ⚽</button>
    </div>`;
  document.body.appendChild(el);
  el.querySelector('#intro-go').addEventListener('click', () => {
    try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* ignore */ }
    el.classList.add('is-hidden');
    setTimeout(() => el.remove(), 360);
    runCounters(app);
  });
}

async function start() {
  try {
    const plan = await loadPlan();
    ctx = { plan, refresh: render, navigate: (h) => { location.hash = h; } };
    if (titleEl) titleEl.textContent = playerName(plan);
    setHeaderMeta(plan);
  } catch (err) {
    app.innerHTML = `<div class="note">Couldn't load the training plan.<br><small>${err.message}</small></div>`;
    const s = document.getElementById('splash'); if (s) s.classList.add('is-hidden');
    return;
  }
  window.addEventListener('hashchange', render);
  render();
  hideSplash();

  // Register the service worker for offline use (only over http/https).
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

start();
