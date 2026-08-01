/* Slurp — rate my ramen. Plain JS, no build step. */
(() => {
  'use strict';

  // ── config ──────────────────────────────────────────────────
  const CRITERIA = [
    { key: 'broth',    name: 'The broth',    sub: 'Depth, balance, aroma. The soul of the bowl — does it haunt you?',          emoji: '🍲', weight: 30 },
    { key: 'noodles',  name: 'The noodles',  sub: 'Texture, bite, slurpability. Fresh and springy, or sad and soggy?',         emoji: '🍜', weight: 25 },
    { key: 'toppings', name: 'The toppings', sub: 'Chashu, menma, nori and friends. Do they earn their place?',                emoji: '🥓', weight: 15 },
    { key: 'egg',      name: 'The egg',      sub: 'The ajitama. Jammy golden yolk, well-seasoned white — or an afterthought?', emoji: '🥚', weight: 10 },
    { key: 'vibe',     name: 'The vibe',     sub: 'Presentation, atmosphere, service. Did the place feel special?',            emoji: '🏮', weight: 10 },
    { key: 'value',    name: 'The value',    sub: 'Worth every penny? Would you pay it again tomorrow?',                        emoji: '💴', weight: 10 },
  ];
  const STYLES = ['Tonkotsu', 'Shoyu', 'Shio', 'Miso', 'Tsukemen', 'Tantanmen', 'Curry', 'Veggie/Vegan', 'Other'];
  const FIRMNESS = ['Yawa (soft)', 'Regular', 'Kata (firm)', 'Bari-kata'];
  const TAGS = ['Umami bomb', 'Rich & creamy', 'Light & clean', 'Garlicky', 'Smoky', 'Salty', 'Fresh noodles', 'Big portion', 'Free kae-dama', 'Long queue', 'Hidden gem', 'Instagram bait'];
  const VERDICTS = [
    [9.5, 'Transcendent'], [9, 'Outstanding'], [8, 'Excellent'], [7, 'Great'],
    [6, 'Solid'], [5, 'Decent'], [4, 'Meh'], [2.5, 'Rough'], [0, 'Avoid'],
  ];
  const LEVELS = [
    { at: 0,  emoji: '🐣', name: 'Noodle Newbie' },
    { at: 3,  emoji: '🥢', name: 'Chopstick Cadet' },
    { at: 8,  emoji: '🍜', name: 'Slurp Apprentice' },
    { at: 15, emoji: '🍥', name: 'Broth Scholar' },
    { at: 25, emoji: '🏮', name: 'Ramen Sensei' },
    { at: 40, emoji: '👑', name: 'Slurp Master' },
  ];
  const BADGES = [
    { id: 'first',    emoji: '🍜', name: 'First Slurp',    req: 'Rate 1 bowl',         test: (S) => S.count >= 1 },
    { id: 'novice',   emoji: '🥢', name: 'Noodle Novice',  req: 'Rate 5 bowls',        test: (S) => S.count >= 5 },
    { id: 'scholar',  emoji: '🍥', name: 'Broth Scholar',  req: 'Rate 15 bowls',       test: (S) => S.count >= 15 },
    { id: 'sensei',   emoji: '🏮', name: 'Ramen Sensei',   req: 'Rate 30 bowls',       test: (S) => S.count >= 30 },
    { id: 'explorer', emoji: '🗺️', name: 'Style Explorer', req: 'Try 4 styles',        test: (S) => S.styles >= 4 },
    { id: 'wanderer', emoji: '🌏', name: 'Wanderer',       req: 'Visit 5 places',      test: (S) => S.places >= 5 },
    { id: 'perfect',  emoji: '💯', name: 'Perfect Bowl',   req: 'Score a 9.5+',        test: (S) => S.best >= 9.5 },
    { id: 'spice',    emoji: '🔥', name: 'Spice Demon',    req: 'Max the spice',       test: (S) => S.maxSpice >= 3 },
    { id: 'shooter',  emoji: '📸', name: 'Bowl Paparazzi', req: 'Photograph 10 bowls', test: (S) => S.photos >= 10 },
    { id: 'spender',  emoji: '💸', name: 'Big Spender',    req: 'Spend £100 total',    test: (S) => S.spend >= 100 },
  ];
  const GUIDE = [
    { emoji: '🐷', title: 'Tonkotsu', body: 'Pork-bone broth boiled for hours until milky and rich. Look for: <strong>silky body without greasiness</strong>, deep porky sweetness, thin firm noodles (Hakata style). Ask for kae-dama — a noodle refill for your leftover broth.' },
    { emoji: '🫖', title: 'Shoyu', body: 'Soy-sauce based, usually a clear brown chicken or dashi broth. The oldest ramen style. Look for: <strong>clarity, aroma, and balance</strong> — salt should lift the broth, not drown it.' },
    { emoji: '🧂', title: 'Shio', body: 'Salt-based and the lightest of the classics. Nowhere for a kitchen to hide — <strong>the broth quality is fully exposed</strong>. A great shio is a sign of a serious shop.' },
    { emoji: '🌽', title: 'Miso', body: 'Born in Sapporo. Fermented bean paste makes it hearty, nutty and sweet, often with corn and butter. Look for: <strong>toasted depth, wavy medium-thick noodles</strong> that grip the broth.' },
    { emoji: '🍝', title: 'Tsukemen', body: 'Dipping ramen — thick cold noodles served beside an intense, almost gravy-like broth. Dip, slurp, repeat. Finish by asking for <strong>soup-wari</strong> (dashi to dilute the leftover dip so you can drink it).' },
    { emoji: '🌶️', title: 'Tantanmen', body: 'Japan\'s take on Sichuan dan dan noodles — sesame, chilli oil, minced pork. Look for: <strong>creamy sesame + real chilli kick</strong> in balance, not just heat.' },
    { emoji: '🥢', title: 'How to slurp', body: 'Slurping is correct — it aerates the broth and cools the noodles. Eat noodles <strong>first and fast</strong> (they overcook in the bowl in ~5 minutes), then toppings, then decide if the broth deserves finishing. Finishing the broth is the highest compliment.' },
    { emoji: '⚖️', title: 'How we score', body: 'Each bowl is scored 0–10 on six criteria with weights: <strong>Broth 30%, Noodles 25%, Toppings 15%, Egg 10%, Vibe 10%, Value 10%</strong>. The overall is the weighted average. 8+ is a destination bowl. 9.5+ is once-a-year stuff.' },
  ];

  // ── state ───────────────────────────────────────────────────
  let bowls = [];
  let raters = [];
  let currentRater = '';
  let earned = [];
  let editingId = null;
  let form = null;
  let wizStep = 0;
  let drafts = [];
  let currentDraftId = null;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* no-op */ } };

  // ── scoring helpers ─────────────────────────────────────────
  function overall(scores) {
    let sum = 0, w = 0;
    for (const c of CRITERIA) {
      const v = scores[c.key];
      if (typeof v === 'number') { sum += v * c.weight; w += c.weight; }
    }
    return w ? Math.round((sum / w) * 10) / 10 : 0;
  }
  const fmtScore = (s) => (Math.round(s * 10) / 10).toFixed(1);
  function verdict(s) { for (const [min, word] of VERDICTS) if (s >= min) return word; return ''; }
  function scoreColor(s) {
    // 0 → deep red, 10 → rich amber-gold (dark enough for white text)
    const t = Math.max(0, Math.min(1, s / 10));
    return `hsl(${5 + t * 35}, ${68 + t * 14}%, ${46 - t * 2}%)`;
  }
  const critShort = (c) => {
    const s = c.name.replace('The ', '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };
  function levelFor(count) {
    let cur = LEVELS[0], next = null;
    for (const l of LEVELS) { if (count >= l.at) cur = l; else { next = l; break; } }
    return { cur, next };
  }

  // ── view switching ──────────────────────────────────────────
  const VIEWS = ['bowls', 'ranks', 'rate', 'stats', 'guide'];
  function switchView(name) {
    for (const v of VIEWS) $(`view-${v}`).hidden = v !== name;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.view === name));
    document.body.classList.toggle('rating', name === 'rate');
    window.scrollTo({ top: 0 });
    if (name === 'bowls') renderBowls();
    if (name === 'ranks') renderRanks();
    if (name === 'stats') renderStats();
    if (name === 'rate') renderWiz();
    haptic();
  }

  // ── form state ──────────────────────────────────────────────
  function blankForm() {
    const scores = {};
    for (const c of CRITERIA) scores[c.key] = 7;
    return {
      place: '', area: '', date: new Date().toISOString().slice(0, 10),
      style: 'Tonkotsu', scores, firmness: 'Regular', spice: 0,
      tags: [], price: '', notes: '', again: true,
      photo: null, thumb: null,
    };
  }
  function startRating(fromBowl, draftId) {
    if (fromBowl) {
      editingId = fromBowl.id;
      form = {
        place: fromBowl.place, area: fromBowl.area || '', date: fromBowl.date, style: fromBowl.style,
        scores: { ...fromBowl.scores }, firmness: fromBowl.firmness || 'Regular', spice: fromBowl.spice || 0,
        tags: [...(fromBowl.tags || [])], price: fromBowl.price != null ? String(fromBowl.price) : '',
        notes: fromBowl.notes || '', again: fromBowl.again !== false,
        photo: fromBowl.photo, thumb: fromBowl.thumb,
      };
      wizStep = STEPS.length - 1; // jump to review, edit sections from there
      currentDraftId = null;
    } else {
      const d = draftId ? drafts.find((x) => x.id === draftId) : null;
      editingId = null;
      if (d) {
        currentDraftId = d.id;
        form = JSON.parse(JSON.stringify(d.form));
        wizStep = Math.min(d.wizStep || 0, STEPS.length - 1);
        toast('Picking up where you left off 📝');
      } else {
        currentDraftId = null;
        form = blankForm();
        wizStep = 0;
      }
    }
    switchView('rate');
  }

  // ── drafts (new ratings only — edits are all-or-nothing) ────
  // Several bowls can be in progress at once; each gets its own slot.
  let draftTimer = null;
  function formDirty() {
    if (form.place || form.area || form.photo || form.notes || form.price) return true;
    if (form.tags.length || form.spice || form.firmness !== 'Regular' || form.style !== 'Tonkotsu' || !form.again) return true;
    return CRITERIA.some((c) => form.scores[c.key] !== 7);
  }
  const saveDrafts = () => DB.setMeta('drafts', drafts);
  function persistDraft() {
    if (!form || editingId || !document.body.classList.contains('rating')) return;
    if (!formDirty()) {
      if (currentDraftId) removeDraft(currentDraftId);
      return;
    }
    if (!currentDraftId) currentDraftId = uid();
    const rec = { id: currentDraftId, form: JSON.parse(JSON.stringify(form)), wizStep, savedAt: Date.now() };
    const i = drafts.findIndex((d) => d.id === currentDraftId);
    if (i >= 0) drafts[i] = rec; else drafts.unshift(rec);
    saveDrafts();
  }
  function scheduleDraft() {
    if (editingId) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(persistDraft, 500);
  }
  function removeDraft(id) {
    clearTimeout(draftTimer);
    drafts = drafts.filter((d) => d.id !== id);
    if (currentDraftId === id) currentDraftId = null;
    saveDrafts();
  }

  // ── wizard ──────────────────────────────────────────────────
  const STEPS = [
    { id: 'basics' }, { id: 'photo' },
    ...CRITERIA.map((c) => ({ id: 'crit', crit: c })),
    { id: 'extras' }, { id: 'review' },
  ];
  const stepIndexFor = (id, critKey) =>
    STEPS.findIndex((s) => s.id === id && (!critKey || (s.crit && s.crit.key === critKey)));

  function renderWiz() {
    const step = STEPS[wizStep];
    $('wiz-bar').style.width = ((wizStep + 1) / STEPS.length * 100) + '%';
    $('wiz-back').textContent = wizStep === 0 ? '✕' : '←';
    $('wiz-close').hidden = wizStep === 0;
    const body = $('wiz-body');
    const n = `Step ${wizStep + 1} of ${STEPS.length}`;

    if (step.id === 'basics') {
      body.innerHTML = `
        <p class="wiz-kicker">${n} · The basics</p>
        <h2 class="wiz-h">Where are you slurping?</h2>
        <p class="wiz-p">Name the place — everything else is optional.</p>
        <label class="field">
          <span class="field-label">Restaurant</span>
          <input type="text" id="f-place" list="place-suggest" placeholder="e.g. Ramen Dayo" autocomplete="off" value="${esc(form.place)}" />
          <datalist id="place-suggest">${[...new Set(bowls.map((b) => b.place))].sort().map((p) => `<option value="${esc(p)}"></option>`).join('')}</datalist>
        </label>
        <label class="field">
          <span class="field-label">Area / city <em>optional</em></span>
          <input type="text" id="f-area" placeholder="e.g. Glasgow" autocomplete="off" value="${esc(form.area)}" />
        </label>
        <label class="field">
          <span class="field-label">Date</span>
          <input type="date" id="f-date" value="${esc(form.date)}" />
        </label>
        <div class="field">
          <span class="field-label">Ramen style</span>
          <div class="chips" id="style-chips">${STYLES.map((s) => `<button type="button" class="chip ${s === form.style ? 'on' : ''}" data-style="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        </div>
        <div class="field">
          <span class="field-label">Who's rating?</span>
          <div class="chips" id="rater-chips"></div>
        </div>`;
      paintRaters();
      $('f-place').addEventListener('input', () => {
        form.place = $('f-place').value;
        const known = bowls.find((b) => b.place.toLowerCase() === form.place.trim().toLowerCase());
        if (known && !$('f-area').value && known.area) { form.area = known.area; $('f-area').value = known.area; }
      });
      $('f-area').addEventListener('input', () => { form.area = $('f-area').value; });
      $('f-date').addEventListener('input', () => { form.date = $('f-date').value; });
      $('style-chips').addEventListener('click', (e) => {
        const b = e.target.closest('[data-style]');
        if (!b) return;
        form.style = b.dataset.style;
        $('style-chips').querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.style === form.style));
        haptic();
      });

    } else if (step.id === 'photo') {
      body.innerHTML = `
        <p class="wiz-kicker">${n} · The evidence</p>
        <h2 class="wiz-h">Shoot the bowl 📸</h2>
        <p class="wiz-p">Before you touch it. Steam is part of the shot.</p>
        <label class="photo-drop" id="photo-drop">
          <input type="file" id="photo-input" accept="image/*" capture="environment" hidden />
          <div class="photo-placeholder" id="photo-placeholder" ${form.photo ? 'hidden' : ''}>
            <span class="photo-ico" aria-hidden="true">📸</span>
            <strong>Add a photo of the bowl</strong>
            <small>Tap to shoot or pick from library</small>
          </div>
          <img id="photo-preview" alt="Bowl photo" ${form.photo ? `src="${form.photo}"` : 'hidden'} />
          <button type="button" class="photo-remove" id="photo-remove" ${form.photo ? '' : 'hidden'} aria-label="Remove photo">✕</button>
        </label>`;
      $('photo-input').addEventListener('change', onPhotoPicked);
      $('photo-remove').addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        form.photo = null; form.thumb = null;
        renderWiz();
      });

    } else if (step.id === 'crit') {
      const c = step.crit;
      const v = form.scores[c.key];
      body.innerHTML = `
        <p class="wiz-kicker">${n} · Counts for ${c.weight}%</p>
        <span class="wiz-emoji">${c.emoji}</span>
        <h2 class="wiz-h">${c.name}</h2>
        <p class="wiz-p">${c.sub}</p>
        <div class="score-big">
          <div class="score-big-num" id="crit-num">${v.toFixed(1)}</div>
          <div class="score-big-word" id="crit-word">${verdict(v)}</div>
        </div>
        <div class="srow">
          <input type="range" min="0" max="10" step="0.5" value="${v}" id="crit-range" aria-label="${c.name} score" />
          <div class="slider-ends"><span>0 · tragic</span><span>10 · perfect</span></div>
        </div>`;
      const range = $('crit-range');
      const paint = () => {
        const val = parseFloat(range.value);
        form.scores[c.key] = val;
        range.style.setProperty('--p', val * 10);
        range.style.setProperty('--tc', scoreColor(val));
        $('crit-num').textContent = val.toFixed(1);
        $('crit-num').style.color = scoreColor(val);
        $('crit-word').textContent = verdict(val);
        $('crit-word').style.color = scoreColor(val);
        updateWizBottom();
      };
      range.addEventListener('input', () => { paint(); haptic(4); });
      paint();

    } else if (step.id === 'extras') {
      body.innerHTML = `
        <p class="wiz-kicker">${n} · The details</p>
        <h2 class="wiz-h">Final touches</h2>
        <p class="wiz-p">All optional — skip anything you like.</p>
        <div class="field">
          <span class="field-label">Noodle firmness</span>
          <div class="seg" id="firmness-seg">${FIRMNESS.map((f) => `<button type="button" class="${f === form.firmness ? 'on' : ''}" data-firm="${esc(f)}">${esc(f.split(' ')[0])}</button>`).join('')}</div>
        </div>
        <div class="field">
          <span class="field-label">Spice level</span>
          <div class="spice" id="spice-row">${['🚫', '🌶️', '🌶️', '🌶️'].map((em, i) => `<button type="button" data-spice="${i}" aria-label="Spice ${i}">${em}</button>`).join('')}</div>
        </div>
        <div class="field">
          <span class="field-label">Quick tags</span>
          <div class="chips" id="tag-chips">${TAGS.map((t) => `<button type="button" class="chip ${form.tags.includes(t) ? 'on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        </div>
        <label class="field">
          <span class="field-label">Price <em>optional</em></span>
          <div class="pricewrap"><span>£</span><input type="number" id="f-price" inputmode="decimal" min="0" step="0.5" placeholder="0.00" value="${esc(form.price)}" /></div>
        </label>
        <label class="field">
          <span class="field-label">Tasting notes <em>optional</em></span>
          <textarea id="f-notes" rows="3" placeholder="What made it great (or not)…">${esc(form.notes)}</textarea>
        </label>
        <label class="switch-row">
          <span><strong>Slurp again?</strong><br/><small>Would you go back for this bowl</small></span>
          <span class="switch"><input type="checkbox" id="f-again" ${form.again ? 'checked' : ''} /><i></i></span>
        </label>`;
      paintSpice();
      $('firmness-seg').addEventListener('click', (e) => {
        const b = e.target.closest('[data-firm]');
        if (!b) return;
        form.firmness = b.dataset.firm;
        $('firmness-seg').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.firm === form.firmness));
        haptic();
      });
      $('spice-row').addEventListener('click', (e) => {
        const b = e.target.closest('[data-spice]');
        if (!b) return;
        form.spice = parseInt(b.dataset.spice, 10);
        paintSpice(); haptic();
      });
      $('tag-chips').addEventListener('click', (e) => {
        const b = e.target.closest('[data-tag]');
        if (!b) return;
        const t = b.dataset.tag;
        const i = form.tags.indexOf(t);
        if (i >= 0) form.tags.splice(i, 1); else form.tags.push(t);
        b.classList.toggle('on', i < 0);
        haptic();
      });
      $('f-price').addEventListener('input', () => { form.price = $('f-price').value; });
      $('f-notes').addEventListener('input', () => { form.notes = $('f-notes').value; });
      $('f-again').addEventListener('change', () => { form.again = $('f-again').checked; haptic(); });

    } else if (step.id === 'review') {
      const s = overall(form.scores);
      const rows = [
        { ico: '📍', label: 'Place', value: [form.place || '—', form.area, fmtDate(form.date)].filter(Boolean).join(' · '), go: ['basics'] },
        { ico: '🍜', label: 'Style', value: form.style + (form.firmness !== 'Regular' ? ` · ${form.firmness}` : '') + (form.spice ? ' · ' + '🌶️'.repeat(form.spice) : ''), go: ['basics'] },
        ...CRITERIA.map((c) => ({ ico: c.emoji, label: `${critShort(c)} · ${c.weight}%`, value: '', score: form.scores[c.key], go: ['crit', c.key] })),
        { ico: '💴', label: 'Price & tags', value: [form.price ? `£${form.price}` : '', ...form.tags].filter(Boolean).join(' · ') || 'None added', go: ['extras'] },
      ];
      body.innerHTML = `
        <p class="wiz-kicker">${n} · The verdict</p>
        <h2 class="wiz-h">${editingId ? 'Review your edits' : 'The final score'}</h2>
        <div class="review-hero">
          <div class="review-dial" style="--pct:${s * 10};--dial-c:${scoreColor(s)}"><span>${fmtScore(s)}</span></div>
          <div class="review-verdict" style="color:${scoreColor(s)}">${verdict(s)}</div>
          <p class="hint" style="margin-top:6px">${form.again ? '💚 Would slurp again' : '🙅 Would not go back'}${currentRater ? ` · rated by ${esc(currentRater)}` : ''}</p>
        </div>
        ${form.photo ? `<button class="review-row" data-go="photo"><img class="review-thumb" src="${form.photo}" alt=""/><span class="r-main"><span class="r-label">Photo</span><span class="r-value">Looking tasty</span></span><span class="r-chev">›</span></button>` : `<button class="review-row" data-go="photo"><span class="r-ico">📸</span><span class="r-main"><span class="r-label">Photo</span><span class="r-value" style="color:var(--muted)">Add one?</span></span><span class="r-chev">›</span></button>`}
        ${rows.map((r) => `
          <button class="review-row" data-go="${r.go[0]}" ${r.go[1] ? `data-crit-key="${r.go[1]}"` : ''}>
            <span class="r-ico">${r.ico}</span>
            <span class="r-main">
              <span class="r-label">${esc(r.label)}</span>
              ${r.value ? `<span class="r-value">${esc(r.value)}</span>` : ''}
            </span>
            ${r.score !== undefined ? `<span class="r-score" style="color:${scoreColor(r.score)}">${r.score.toFixed(1)}</span>` : ''}
            <span class="r-chev">›</span>
          </button>`).join('')}
        ${form.notes ? `<div class="sheet-notes">“${esc(form.notes)}”</div>` : ''}`;
      body.querySelectorAll('[data-go]').forEach((b) =>
        b.addEventListener('click', () => {
          wizStep = stepIndexFor(b.dataset.go, b.dataset.critKey);
          renderWiz(); haptic();
        }));
    }

    updateWizBottom();
    scheduleDraft(); // remember the current step too
  }

  function paintSpice() {
    const row = $('spice-row');
    if (!row) return;
    row.querySelectorAll('button').forEach((b) => {
      const i = parseInt(b.dataset.spice, 10);
      b.classList.toggle('on', i === 0 ? form.spice === 0 : (form.spice >= i && i > 0));
    });
  }
  function paintRaters() {
    const el = $('rater-chips');
    if (!el) return;
    el.innerHTML = raters.map((r) =>
      `<button type="button" class="chip ${r === currentRater ? 'on' : ''}" data-rater="${esc(r)}">${esc(r)}</button>`).join('') +
      `<button type="button" class="chip chip-add" data-add-rater>＋ Add</button>`;
  }

  function updateWizBottom() {
    const step = STEPS[wizStep];
    const s = overall(form.scores);
    $('wiz-score').innerHTML = `Running score<strong style="color:${scoreColor(s)}">${fmtScore(s)} · ${verdict(s)}</strong>`;
    const next = $('wiz-next');
    if (step.id === 'review') next.textContent = editingId ? 'Save changes 🍜' : 'Save this bowl 🍜';
    else if (step.id === 'photo' && !form.photo) next.textContent = 'Skip';
    else next.textContent = 'Next';
  }

  function wizNext() {
    const step = STEPS[wizStep];
    if (step.id === 'basics') {
      form.place = ($('f-place') ? $('f-place').value : form.place).trim();
      if (!form.place) {
        toast('Give the place a name first 🏮');
        $('f-place') && $('f-place').focus();
        return;
      }
    }
    if (step.id === 'review') { saveBowl(); return; }
    wizStep = Math.min(wizStep + 1, STEPS.length - 1);
    renderWiz(); haptic();
  }
  function wizBack() {
    if (wizStep === 0) { exitWiz(); return; }
    wizStep -= 1;
    renderWiz(); haptic();
  }
  function exitWiz() {
    if (!editingId && formDirty()) {
      persistDraft();
      toast('Draft saved — pick it up any time 📝');
    } else if (editingId) {
      toast('Edit discarded');
    }
    editingId = null;
    currentDraftId = null;
    switchView('bowls');
  }

  // ── photo compression ───────────────────────────────────────
  function onPhotoPicked(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      form.photo = drawScaled(img, 1280, 0.82);
      form.thumb = drawScaled(img, 320, 0.7);
      URL.revokeObjectURL(url);
      renderWiz();
      toast('Looking tasty 📸');
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('Could not read that photo'); };
    img.src = url;
    e.target.value = '';
  }
  function drawScaled(img, maxDim, quality) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/jpeg', quality);
  }

  // ── save + gamification ─────────────────────────────────────
  function statsSnapshot() {
    return {
      count: bowls.length,
      styles: new Set(bowls.map((b) => b.style)).size,
      places: new Set(bowls.map((b) => b.place.trim().toLowerCase())).size,
      best: bowls.length ? Math.max(...bowls.map((b) => b.overall)) : 0,
      maxSpice: Math.max(0, ...bowls.map((b) => b.spice || 0)),
      photos: bowls.filter((b) => b.photo).length,
      spend: bowls.reduce((s, b) => s + (b.price || 0), 0),
    };
  }
  async function saveBowl() {
    const record = {
      id: editingId || uid(),
      createdAt: editingId ? (bowls.find((b) => b.id === editingId)?.createdAt || Date.now()) : Date.now(),
      place: form.place.trim(),
      area: form.area.trim(),
      date: form.date || new Date().toISOString().slice(0, 10),
      style: form.style,
      scores: { ...form.scores },
      overall: overall(form.scores),
      firmness: form.firmness,
      spice: form.spice,
      tags: [...form.tags],
      price: form.price ? parseFloat(form.price) : null,
      notes: form.notes.trim(),
      again: form.again,
      rater: currentRater,
      photo: form.photo,
      thumb: form.thumb,
    };
    await DB.putBowl(record);
    const idx = bowls.findIndex((b) => b.id === record.id);
    if (idx >= 0) bowls[idx] = record; else bowls.push(record);
    const wasEdit = !!editingId;
    editingId = null;
    clearTimeout(draftTimer); // a pending auto-save must not resurrect the draft
    if (currentDraftId) removeDraft(currentDraftId);

    confetti();
    toast(wasEdit ? 'Bowl updated ✅' : `Saved — ${fmtScore(record.overall)}/10 ${verdict(record.overall)}!`);
    switchView('bowls');
    setLevelPill();

    // badge unlocks
    const S = statsSnapshot();
    const fresh = BADGES.filter((b) => b.test(S) && !earned.includes(b.id));
    if (fresh.length) {
      earned.push(...fresh.map((b) => b.id));
      DB.setMeta('earned', earned);
      fresh.forEach((b, i) => setTimeout(() => { toast(`${b.emoji} Badge unlocked — ${b.name}!`); confetti(); }, 2200 + i * 2400));
    }
  }

  // ── bowls list ──────────────────────────────────────────────
  function bowlCard(b) {
    const c = scoreColor(b.overall);
    const thumb = b.thumb || b.photo;
    const meta = [b.style, fmtDate(b.date), b.rater].filter(Boolean).join(' · ');
    return `
      <button class="bowl-card" data-open="${b.id}">
        ${thumb ? `<img class="bowl-thumb" src="${thumb}" alt="" loading="lazy" />` : `<span class="bowl-thumb">🍜</span>`}
        <span class="bowl-mid">
          <span class="bowl-place">${esc(b.place)}</span>
          <span class="bowl-meta">${esc(meta)}</span>
          <span class="bowl-badges">
            ${b.again ? '' : '<span class="mini-tag">🙅 not again</span>'}
            ${b.spice >= 3 ? '<span class="mini-tag">🔥🔥🔥</span>' : ''}
            ${(b.tags || []).slice(0, 2).map((t) => `<span class="mini-tag">${esc(t)}</span>`).join('')}
          </span>
        </span>
        <span class="score-pill" style="background:${c}">${fmtScore(b.overall)}<small>/10</small></span>
      </button>`;
  }

  function renderBowls() {
    const q = $('bowl-search').value.trim().toLowerCase();
    const sort = $('bowl-sort').value;
    let list = bowls.slice();
    if (q) {
      list = list.filter((b) =>
        [b.place, b.area, b.style, b.notes, b.rater, ...(b.tags || [])]
          .filter(Boolean).some((f) => f.toLowerCase().includes(q)));
    }
    list.sort((a, b) => {
      if (sort === 'top') return b.overall - a.overall;
      if (sort === 'low') return a.overall - b.overall;
      if (sort === 'price') return (b.price || 0) - (a.price || 0);
      return (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt;
    });
    $('bowls-empty').hidden = bowls.length > 0;
    const banner = (!q && drafts.length) ? drafts.slice().sort((a, b) => b.savedAt - a.savedAt).map((d) => `
      <div class="draft-banner">
        <span class="draft-ico" aria-hidden="true">📝</span>
        <span class="draft-info">
          <span class="draft-title">${d.form.place ? esc(d.form.place) : 'Unnamed bowl'}</span>
          <span class="draft-meta">In progress · ${esc(d.form.style || '')} · step ${(d.wizStep || 0) + 1} of ${STEPS.length}</span>
        </span>
        <button class="btn btn-primary btn-sm" data-resume-draft="${d.id}">Continue</button>
        <button class="draft-x" data-discard-draft="${d.id}" aria-label="Discard draft">✕</button>
      </div>`).join('') : '';
    $('bowl-list').innerHTML = banner + (list.map(bowlCard).join('') ||
      (bowls.length ? `<div class="empty"><div class="empty-art">🔎</div><h2>No matches</h2><p>Nothing found for “${esc(q)}”.</p></div>` : ''));
  }

  // ── detail sheet ────────────────────────────────────────────
  function openSheet(id) {
    const b = bowls.find((x) => x.id === id);
    if (!b) return;
    const c = scoreColor(b.overall);
    const bars = CRITERIA.map((cr) => {
      const v = b.scores[cr.key] ?? 0;
      return `
        <div class="sbar-row">
          <span class="sbar-name">${cr.emoji} ${critShort(cr)}</span>
          <span class="sbar-track"><span class="sbar-fill" style="width:${v * 10}%;background:${scoreColor(v)}"></span></span>
          <span class="sbar-val">${v.toFixed(1)}</span>
        </div>`;
    }).join('');
    const meta = [b.style, b.area, fmtDate(b.date)].filter(Boolean).join(' · ');
    const detail = [b.firmness && b.firmness !== 'Regular' ? `Noodles: ${b.firmness}` : '', b.spice ? '🌶️'.repeat(b.spice) : '', b.price != null ? `£${b.price.toFixed(2)}` : '', b.rater ? `rated by ${b.rater}` : ''].filter(Boolean).join(' · ');
    $('sheet').innerHTML = `
      <div class="sheet-grab"></div>
      <button class="sheet-close" data-close-sheet aria-label="Close">✕</button>
      ${b.photo ? `<img class="sheet-photo" src="${b.photo}" alt="Bowl at ${esc(b.place)}" />` : ''}
      <div class="sheet-head">
        <div>
          <div class="sheet-place">${esc(b.place)}</div>
          <div class="sheet-meta">${esc(meta)}</div>
          ${detail ? `<div class="sheet-meta">${esc(detail)}</div>` : ''}
        </div>
        <span class="score-pill" style="background:${c}">${fmtScore(b.overall)}<small>/10</small></span>
      </div>
      <p class="again-line">${b.again ? '💚 Would slurp again' : '🙅 Would not go back'} · <span style="color:${c}">${verdict(b.overall)}</span></p>
      <div class="sheet-bars">${bars}</div>
      ${(b.tags || []).length ? `<div class="sheet-tags">${b.tags.map((t) => `<span class="mini-tag">${esc(t)}</span>`).join('')}</div>` : ''}
      ${b.notes ? `<div class="sheet-notes">“${esc(b.notes)}”</div>` : ''}
      <div class="sheet-actions">
        <button class="btn btn-ghost" data-act="share">📤 Share</button>
        <button class="btn btn-ghost" data-act="edit">✏️ Edit</button>
        <button class="btn btn-danger" data-act="delete">🗑️</button>
      </div>`;
    $('sheet').hidden = false;
    $('sheet-backdrop').hidden = false;
    $('sheet').scrollTop = 0;
    document.body.style.overflow = 'hidden';
    $('sheet').onclick = async (e) => {
      if (e.target.closest('[data-close-sheet]')) { closeSheet(); return; }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'edit') {
        closeSheet();
        startRating(b);
      } else if (act.dataset.act === 'delete') {
        if (!confirm(`Delete the bowl at ${b.place}? This can't be undone.`)) return;
        await DB.deleteBowl(b.id);
        bowls = bowls.filter((x) => x.id !== b.id);
        closeSheet();
        renderBowls();
        toast('Bowl deleted');
      } else if (act.dataset.act === 'share') {
        shareBowl(b);
      }
    };
  }
  function closeSheet() {
    $('sheet').hidden = true;
    $('sheet-backdrop').hidden = true;
    document.body.style.overflow = '';
  }

  // ── standings ───────────────────────────────────────────────
  function placeStats() {
    const map = new Map();
    for (const b of bowls) {
      const key = b.place.trim().toLowerCase();
      if (!map.has(key)) map.set(key, { name: b.place, area: b.area, bowls: [] });
      map.get(key).bowls.push(b);
    }
    const out = [...map.values()].map((p) => ({
      name: p.name,
      area: p.area,
      count: p.bowls.length,
      avg: p.bowls.reduce((s, b) => s + b.overall, 0) / p.bowls.length,
      best: Math.max(...p.bowls.map((b) => b.overall)),
    }));
    out.sort((a, b) => b.avg - a.avg || b.count - a.count);
    return out;
  }

  function renderRanks() {
    const places = placeStats();
    $('ranks-empty').hidden = places.length > 0;
    if (!places.length) { $('podium').innerHTML = ''; $('rank-list').innerHTML = ''; return; }
    const top = places.slice(0, 3);
    const medals = ['🥇', '🥈', '🥉'];
    const heights = [96, 72, 56];
    const order = top.length === 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0];
    $('podium').innerHTML = order.map((i) => `
      <div class="podium-col" style="animation-delay:${i * 80}ms">
        <span class="podium-medal">${medals[i]}</span>
        <span class="podium-name">${esc(top[i].name)}</span>
        <span class="podium-score">${fmtScore(top[i].avg)}</span>
        <div class="podium-bar" style="height:${heights[i]}px">${i + 1}</div>
      </div>`).join('');
    $('rank-list').innerHTML = places.slice(3).map((p, i) => `
      <div class="rank-row">
        <span class="rank-pos">${i + 4}</span>
        <span class="rank-info">
          <span class="rank-name">${esc(p.name)}</span>
          <div class="rank-meta">${p.count} bowl${p.count > 1 ? 's' : ''}${p.area ? ' · ' + esc(p.area) : ''} · best ${fmtScore(p.best)}</div>
        </span>
        <span class="rank-score" style="color:${scoreColor(p.avg)}">${fmtScore(p.avg)}</span>
      </div>`).join('');
  }

  // ── stats ───────────────────────────────────────────────────
  function setLevelPill() {
    const { cur } = levelFor(bowls.length);
    $('brand-level').textContent = bowls.length ? `${cur.emoji} ${cur.name}` : '';
  }
  function renderStats() {
    const n = bowls.length;
    const S = statsSnapshot();
    const avg = n ? bowls.reduce((s, b) => s + b.overall, 0) / n : 0;
    const best = bowls.slice().sort((a, b) => b.overall - a.overall)[0];

    // level card
    const { cur, next } = levelFor(n);
    const prevAt = cur.at;
    const pct = next ? Math.min(100, ((n - prevAt) / (next.at - prevAt)) * 100) : 100;
    $('level-card').innerHTML = `
      <div class="level-card">
        <span class="level-emoji">${cur.emoji}</span>
        <span class="level-info">
          <div class="level-name">${cur.name}</div>
          <div class="level-next">${next ? `${next.at - n} more bowl${next.at - n === 1 ? '' : 's'} to ${next.emoji} ${next.name}` : 'Top rank — the broth bows to you'}</div>
          <span class="level-track"><span class="level-fill" style="width:${pct}%"></span></span>
        </span>
      </div>`;

    $('stat-grid').innerHTML = [
      [n, 'bowls slurped'],
      [S.places, S.places === 1 ? 'place' : 'places'],
      [n ? fmtScore(avg) : '–', 'avg score'],
      [best ? fmtScore(best.overall) : '–', 'best bowl'],
      [S.spend ? '£' + (Math.round(S.spend * 100) / 100).toFixed(2).replace(/\.00$/, '') : '£0', 'invested 🍜'],
      [bowls.filter((b) => b.again).length, 'would repeat'],
    ].map(([num, lbl]) => `<div class="stat-tile"><div class="stat-num">${num}</div><div class="stat-lbl">${lbl}</div></div>`).join('');

    $('best-bowl-wrap').innerHTML = best ? `
      <button class="best-bowl" data-open="${best.id}" style="width:100%">
        ${best.photo ? `<img class="bg" src="${best.photo}" alt="" />` : ''}
        <span class="scrim"></span>
        <span class="bb-body">
          <span>
            <span class="bb-kicker">👑 Bowl of honour</span>
            <div class="bb-place">${esc(best.place)}</div>
            <div class="bb-meta">${esc([best.style, fmtDate(best.date)].filter(Boolean).join(' · '))}</div>
          </span>
          <span class="score-pill" style="background:${scoreColor(best.overall)}">${fmtScore(best.overall)}<small>/10</small></span>
        </span>
      </button>` : '';

    const byStyle = new Map();
    for (const b of bowls) {
      if (!byStyle.has(b.style)) byStyle.set(b.style, []);
      byStyle.get(b.style).push(b.overall);
    }
    const rows = [...byStyle.entries()]
      .map(([s, arr]) => ({ s, n: arr.length, avg: arr.reduce((a, x) => a + x, 0) / arr.length }))
      .sort((a, b) => b.avg - a.avg);
    $('style-breakdown-card').hidden = !rows.length;
    $('style-breakdown').innerHTML = rows.map((r) => `
      <div class="sbar-row">
        <span class="sbar-name">${esc(r.s)} ×${r.n}</span>
        <span class="sbar-track"><span class="sbar-fill" style="width:${r.avg * 10}%;background:${scoreColor(r.avg)}"></span></span>
        <span class="sbar-val">${fmtScore(r.avg)}</span>
      </div>`).join('');

    $('badge-grid').innerHTML = BADGES.map((bd) => {
      const got = bd.test(S);
      return `<div class="badge ${got ? '' : 'locked'}">
        <div class="badge-emoji">${bd.emoji}</div>
        <div class="badge-name">${bd.name}</div>
        <div class="badge-req">${bd.req}</div>
      </div>`;
    }).join('');
  }

  // ── share card ──────────────────────────────────────────────
  async function shareBowl(b) {
    const cv = $('share-canvas');
    const W = 1080, H = 1400;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const PH = 720;
    if (b.photo) {
      await new Promise((res) => {
        const img = new Image();
        img.onload = () => {
          const s = Math.max(W / img.width, PH / img.height);
          const w = img.width * s, h = img.height * s;
          ctx.drawImage(img, (W - w) / 2, (PH - h) / 2, w, h);
          res();
        };
        img.onerror = res;
        img.src = b.photo;
      });
    } else {
      ctx.fillStyle = '#f7f7f7'; ctx.fillRect(0, 0, W, PH);
      ctx.font = '220px serif'; ctx.textAlign = 'center';
      ctx.fillText('🍜', W / 2, 430);
    }

    const sys = '-apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#222222';
    ctx.font = `800 62px ${sys}`;
    ctx.fillText(b.place.slice(0, 26), 60, PH + 88);
    ctx.fillStyle = '#6a6a6a';
    ctx.font = `500 34px ${sys}`;
    ctx.fillText([b.style, b.area, fmtDate(b.date)].filter(Boolean).join(' · ').slice(0, 48), 60, PH + 140);

    const cx = W - 190, cy = PH + 105, R = 105;
    ctx.lineWidth = 24; ctx.lineCap = 'round';
    ctx.strokeStyle = '#ebebeb';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = scoreColor(b.overall);
    ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + (b.overall / 10) * Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#222222'; ctx.textAlign = 'center';
    ctx.font = `800 72px ${sys}`;
    ctx.fillText(fmtScore(b.overall), cx, cy + 12);
    ctx.font = `700 24px ${sys}`; ctx.fillStyle = '#6a6a6a';
    ctx.fillText('/ 10 · ' + verdict(b.overall).toUpperCase(), cx, cy + 54);

    let y = PH + 250;
    for (const cr of CRITERIA) {
      const v = b.scores[cr.key] ?? 0;
      ctx.textAlign = 'left'; ctx.fillStyle = '#222222';
      ctx.font = `700 32px ${sys}`;
      ctx.fillText(`${cr.emoji} ${critShort(cr)}`, 60, y + 12);
      const bx = 400, bw = 500;
      ctx.fillStyle = '#ebebeb';
      roundRect(ctx, bx, y - 10, bw, 20, 10); ctx.fill();
      ctx.fillStyle = scoreColor(v);
      roundRect(ctx, bx, y - 10, Math.max(20, bw * v / 10), 20, 10); ctx.fill();
      ctx.textAlign = 'right'; ctx.fillStyle = '#222222';
      ctx.font = `800 32px ${sys}`;
      ctx.fillText(v.toFixed(1), W - 60, y + 12);
      y += 72;
    }

    ctx.textAlign = 'center'; ctx.fillStyle = '#b0b0b0';
    ctx.font = `800 26px ${sys}`;
    ctx.fillText('S L U R P  ·  R A T E  M Y  R A M E N', W / 2, H - 46);

    const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.9));
    const file = new File([blob], `slurp-${b.place.replace(/\W+/g, '-').toLowerCase()}.jpg`, { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `${b.place} — ${fmtScore(b.overall)}/10` });
        return;
      } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('Score card downloaded 📤');
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ── backup ──────────────────────────────────────────────────
  function exportBackup() {
    const payload = { app: 'slurp', version: 1, exportedAt: new Date().toISOString(), raters, bowls };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `slurp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('Backup exported ⬇︎');
  }
  async function importBackup(file) {
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'slurp' || !Array.isArray(data.bowls)) throw new Error('bad file');
      let added = 0;
      for (const b of data.bowls) {
        if (!b.id || !b.place) continue;
        if (!bowls.some((x) => x.id === b.id)) { bowls.push(b); added++; }
        await DB.putBowl(b);
      }
      for (const r of data.raters || []) {
        if (!raters.includes(r)) raters.push(r);
      }
      await DB.setMeta('raters', raters);
      renderBowls(); setLevelPill();
      toast(`Restored — ${added} new bowl${added === 1 ? '' : 's'} 🍜`);
    } catch (e) {
      toast('That file didn\'t look like a Slurp backup');
    }
  }

  // ── fun ─────────────────────────────────────────────────────
  let toastTimer = null;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }
  function confetti() {
    const emojis = ['🍜', '🥢', '🍥', '🥚', '🌶️', '🏮', '✨'];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.textContent = emojis[i % emojis.length];
      s.style.left = Math.random() * 100 + 'vw';
      s.style.top = '-40px';
      s.style.animationDelay = (Math.random() * 0.4) + 's';
      s.style.fontSize = (18 + Math.random() * 18) + 'px';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1800);
    }
    haptic(30);
  }

  // ── guide ───────────────────────────────────────────────────
  function renderGuide() {
    $('guide-content').innerHTML = GUIDE.map((g, i) => `
      <details class="guide-item" ${i === 0 ? 'open' : ''}>
        <summary><span class="guide-emoji">${g.emoji}</span>${esc(g.title)}<span class="arrow">›</span></summary>
        <div class="guide-body">${g.body}</div>
      </details>`).join('');
  }

  // ── init ────────────────────────────────────────────────────
  async function init() {
    // splash: remove from DOM once its exit animation finishes
    setTimeout(() => { const sp = $('splash'); sp && sp.remove(); }, 2400);

    bowls = await DB.allBowls();
    raters = (await DB.getMeta('raters')) || [];
    currentRater = (await DB.getMeta('currentRater')) || raters[0] || '';
    earned = (await DB.getMeta('earned')) || [];
    drafts = (await DB.getMeta('drafts')) || [];
    const legacyDraft = await DB.getMeta('draft'); // pre-multi-draft versions kept one slot
    if (legacyDraft && legacyDraft.form) {
      drafts.unshift({ id: uid(), form: legacyDraft.form, wizStep: legacyDraft.wizStep || 0, savedAt: legacyDraft.savedAt || Date.now() });
      DB.setMeta('draft', null);
      saveDrafts();
    }

    // first launch: pre-populate from the bundled backup (data/seed.json)
    if (!bowls.length) {
      const seeded = await DB.getMeta('seeded');
      if (!seeded) {
        try {
          const res = await fetch('data/seed.json');
          if (res.ok) {
            const seed = await res.json();
            if (seed.app === 'slurp' && Array.isArray(seed.bowls)) {
              for (const b of seed.bowls) {
                if (!b.id || !b.place) continue;
                await DB.putBowl(b);
                bowls.push(b);
              }
              for (const r of seed.raters || []) {
                if (!raters.includes(r)) raters.push(r);
              }
              await DB.setMeta('raters', raters);
              if (!currentRater) currentRater = raters[0] || '';
              // badges covered by the seed shouldn't toast as new unlocks later
              earned = BADGES.filter((bd) => bd.test(statsSnapshot())).map((bd) => bd.id);
              await DB.setMeta('earned', earned);
              await DB.setMeta('seeded', true);
              toast(`Loaded ${bowls.length} bowls from your backup 🍜`);
            }
          }
        } catch (e) { /* best-effort — retry on next launch */ }
      }
    } else {
      DB.setMeta('seeded', true); // existing data: never seed over it
    }

    form = blankForm();
    renderGuide();
    setLevelPill();

    // nav
    document.querySelectorAll('.tab').forEach((t) =>
      t.addEventListener('click', () => {
        if (t.dataset.view === 'rate') startRating();
        else { editingId = null; switchView(t.dataset.view); }
      }));
    document.querySelectorAll('[data-goto]').forEach((b) =>
      b.addEventListener('click', () => startRating()));

    // wizard chrome
    $('wiz-back').addEventListener('click', wizBack);
    $('wiz-close').addEventListener('click', exitWiz);
    $('wiz-next').addEventListener('click', wizNext);
    // any interaction inside the wizard body auto-saves the draft
    for (const ev of ['input', 'change', 'click']) {
      $('wiz-body').addEventListener(ev, scheduleDraft);
    }

    // list interactions
    $('bowl-search').addEventListener('input', renderBowls);
    $('bowl-sort').addEventListener('change', renderBowls);
    document.addEventListener('click', (e) => {
      const res = e.target.closest('[data-resume-draft]');
      if (res) { startRating(null, res.dataset.resumeDraft); return; }
      const dis = e.target.closest('[data-discard-draft]');
      if (dis) {
        if (confirm('Discard this half-rated bowl?')) {
          removeDraft(dis.dataset.discardDraft); renderBowls(); toast('Draft discarded');
        }
        return;
      }
      const open = e.target.closest('[data-open]');
      if (open) openSheet(open.dataset.open);
      const addRater = e.target.closest('[data-add-rater]');
      if (addRater) {
        const name = (prompt('Who\'s rating? (e.g. Leo)') || '').trim();
        if (name) {
          if (!raters.includes(name)) raters.push(name);
          currentRater = name;
          DB.setMeta('raters', raters);
          DB.setMeta('currentRater', currentRater);
          paintRaters();
        }
      }
      const rater = e.target.closest('[data-rater]');
      if (rater) {
        currentRater = rater.dataset.rater === currentRater ? '' : rater.dataset.rater;
        DB.setMeta('currentRater', currentRater);
        paintRaters(); haptic();
      }
    });
    $('sheet-backdrop').addEventListener('click', closeSheet);
    // swipe down from the top of the sheet to dismiss it
    let sheetTouchY = null;
    $('sheet').addEventListener('touchstart', (e) => {
      sheetTouchY = $('sheet').scrollTop <= 0 ? e.touches[0].clientY : null;
    }, { passive: true });
    $('sheet').addEventListener('touchmove', (e) => {
      if (sheetTouchY !== null && e.touches[0].clientY - sheetTouchY > 90) {
        sheetTouchY = null;
        closeSheet();
      }
    }, { passive: true });

    // backup
    $('btn-export').addEventListener('click', exportBackup);
    $('btn-import').addEventListener('click', () => $('import-input').click());
    $('import-input').addEventListener('change', (e) => {
      if (e.target.files[0]) importBackup(e.target.files[0]);
      e.target.value = '';
    });

    if (bowls.length) switchView('bowls');
    else startRating();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  init();
})();
