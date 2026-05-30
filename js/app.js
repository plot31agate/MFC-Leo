// Bootstraps the app, loads the plan, and routes between views via the URL hash.
import { loadPlan } from './plan.js';
import { renderToday } from './views/today.js';
import { renderPlan, renderDay } from './views/plan.js';
import { renderProgress } from './views/progress.js';
import { renderReference } from './views/reference.js';
import { todayISO, daysBetween } from './util.js';

const app = document.getElementById('app');
const titleEl = document.getElementById('header-title');
const metaEl = document.getElementById('header-meta');

function setHeaderMeta(plan) {
  if (!metaEl || !plan) return;
  const days = daysBetween(todayISO(), plan.preSeasonReturn);
  metaEl.innerHTML = days > 0
    ? `<b>${days}</b> day${days === 1 ? '' : 's'} to pre-season`
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
  app.scrollTo?.(0, 0);
  window.scrollTo(0, 0);

  try {
    switch (name) {
      case 'plan': return renderPlan(app, ctx);
      case 'day': return renderDay(app, ctx, arg);
      case 'progress': return renderProgress(app, ctx);
      case 'reference': return renderReference(app, ctx);
      case 'today':
      default: return renderToday(app, ctx);
    }
  } catch (err) {
    app.innerHTML = `<div class="note">Something went wrong rendering this page.<br><small>${err.message}</small></div>`;
    console.error(err);
  }
}

async function start() {
  try {
    const plan = await loadPlan();
    ctx = { plan, refresh: render, navigate: (h) => { location.hash = h; } };
    if (titleEl) titleEl.textContent = plan.athleteName || plan.athlete || 'Leo';
    setHeaderMeta(plan);
  } catch (err) {
    app.innerHTML = `<div class="note">Couldn't load the training plan.<br><small>${err.message}</small></div>`;
    return;
  }
  window.addEventListener('hashchange', render);
  render();

  // Register the service worker for offline use (only over http/https).
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

start();
