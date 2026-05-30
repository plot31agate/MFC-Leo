// Bootstraps the app, loads the plan, and routes between views via the URL hash.
import { loadPlan } from './plan.js';
import { renderToday } from './views/today.js';
import { renderPlan, renderDay } from './views/plan.js';
import { renderProgress } from './views/progress.js';
import { renderReference } from './views/reference.js';
import { mountProteinBar, updateProteinBar } from './views/proteinbar.js';

const app = document.getElementById('app');
const titleEl = document.getElementById('header-title');

const TITLES = {
  today: "Today's Session",
  plan: 'Training Plan',
  progress: 'Your Progress',
  reference: 'Training Guide',
  day: 'Session Detail',
};

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
  titleEl.textContent = TITLES[name] || "Leo's Training";
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
    ctx = { plan, refresh: render, navigate: (h) => { location.hash = h; }, updateProteinBar };
    mountProteinBar(plan);
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
