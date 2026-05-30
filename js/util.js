// Small shared helpers (no dependencies).

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Local YYYY-MM-DD for a Date (avoids UTC off-by-one).
export function isoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Parse a YYYY-MM-DD as a LOCAL date (not UTC).
export function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() { return isoDate(new Date()); }

export function prettyDate(iso) {
  const d = parseISO(iso);
  return `${DOW_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function daysBetween(aIso, bIso) {
  const a = parseISO(aIso), b = parseISO(bIso);
  return Math.round((b - a) / 86400000);
}

// Minimal HTML escaping for any user/plan text rendered into innerHTML.
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Turn http(s) URLs in text into a short tappable "Watch" link list is handled elsewhere;
// here just a guard for valid links.
export function isUrl(s) { return /^https?:\/\//i.test(s || ''); }

export function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Count a number element up from 0 to its target (read from data-to or text).
export function animateCount(el, to, duration = 750) {
  const target = Number(to);
  if (!(target > 0) || prefersReducedMotion()) { el.textContent = String(target || el.textContent); return; }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(eased * target));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Animate every .js-count element under root.
export function runCounters(root = document) {
  root.querySelectorAll('.js-count').forEach((el) => {
    const to = el.dataset.to ?? el.textContent;
    if (!Number.isNaN(Number(to))) animateCount(el, to);
  });
}
