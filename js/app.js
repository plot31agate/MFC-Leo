// Bootstraps the app, loads the plan, and routes between views via the URL hash.
import { loadPlan } from './plan.js';
import { renderToday } from './views/today.js';
import { renderPlan, renderDay } from './views/plan.js';
import { renderProgress } from './views/progress.js';
import { renderReference } from './views/reference.js';
import { todayISO, daysBetween, runCounters } from './util.js';

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

// ---------- First-run guide ----------
const INTRO_KEY = 'mfc.intro.v1';
function maybeIntro() {
  try { if (localStorage.getItem(INTRO_KEY)) return; } catch { return; }
  const sections = [
    ['Today', "Your session for the day — tick each part off as you go, and log protein in the amber bar to hit 140g."],
    ['Plan', 'The whole 4-week programme, counting down to pre-season.'],
    ['Progress', 'Your stats — sessions done, day streak, 5km best and protein days.'],
    ['Guide', 'Warm-ups, drills, gym sessions and nutrition to look up any time.'],
    ['Reminders', 'Tap “Add” on the Today prompt to put session & protein alerts on your phone.'],
  ];
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <div class="intro__card">
      <h2>Welcome, Leo 👋</h2>
      <p class="muted">Your Motherwell pre-season, one day at a time. Here's the app:</p>
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
    if (titleEl) titleEl.textContent = plan.athleteName || plan.athlete || 'Leo';
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
